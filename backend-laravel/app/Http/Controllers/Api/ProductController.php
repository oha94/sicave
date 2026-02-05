<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\StoreProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $warehouseId = $request->input('warehouse_id');

        $query = Product::with([
            'category',
            'shelf',
            'supplier',
            'creator',
            'warehouses' => function ($q) use ($warehouseId) {
                if ($warehouseId) {
                    $q->where('warehouses.id', $warehouseId);
                }
            }
        ]);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('designation', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $perPage = $request->input('per_page', 20);
        return ProductResource::collection($query->latest()->paginate($perPage));
    }

    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] = Auth::id();

        if (empty($data['sku'])) {
            // Generate a unique SKU: P-TIMESTAMP-RAND
            $data['sku'] = 'ART-' . time() . '-' . rand(100, 999);
        }

        if (empty($data['barcode'])) {
            // Auto-increment barcode
            $maxBarcode = Product::whereRaw("barcode REGEXP '^[0-9]+$'")->max(DB::raw('CAST(barcode AS UNSIGNED)'));
            $data['barcode'] = $maxBarcode ? strval($maxBarcode + 1) : '100000100000'; // Start at 100000100000 if none
        }

        $product = Product::create($data);

        return new ProductResource($product);
    }

    public function show(Product $product)
    {
        $product->load(['category', 'shelf', 'supplier', 'creator', 'warehouses']);
        return new ProductResource($product);
    }

    public function update(StoreProductRequest $request, Product $product)
    {
        $product->update($request->validated());
        return new ProductResource($product);
    }

    public function deactivate(Product $product)
    {
        // Check total stock
        $totalStock = $product->warehouses->sum('pivot.stock_actuel');

        if ($totalStock > 0) {
            return response()->json([
                'message' => 'Impossible de désactiver un produit avec du stock positif.'
            ], 422);
        }

        $product->update(['status' => 'inactive']);

        return response()->json(['message' => 'Produit désactivé avec succès.']);
    }

    public function merge(Request $request, Product $sourceProduct)
    {
        $request->validate([
            'target_product_id' => 'required|exists:products,id|different:id'
        ]);

        $targetProduct = Product::findOrFail($request->target_product_id);

        DB::transaction(function () use ($sourceProduct, $targetProduct) {
            foreach ($sourceProduct->warehouses as $warehouse) {
                $qty = $warehouse->pivot->stock_actuel;
                if ($qty > 0) {
                    $targetPivot = $targetProduct->warehouses()->where('warehouse_id', $warehouse->id)->first();

                    if ($targetPivot) {
                        $targetProduct->warehouses()->updateExistingPivot($warehouse->id, [
                            'stock_actuel' => $targetPivot->pivot->stock_actuel + $qty
                        ]);
                    } else {
                        $targetProduct->warehouses()->attach($warehouse->id, [
                            'stock_actuel' => $qty,
                            'stock_alerte' => $warehouse->pivot->stock_alerte ?? 0
                        ]);
                    }

                    // Log Movement (Transfer Out)
                    \App\Models\StockMovement::create([
                        'warehouse_id' => $warehouse->id,
                        'product_id' => $sourceProduct->id,
                        'quantity' => -$qty,
                        'type' => 'transfer_out',
                        'reference_type' => Product::class,
                        'reference_id' => $targetProduct->id
                    ]);

                    // Log Movement (Transfer In)
                    \App\Models\StockMovement::create([
                        'warehouse_id' => $warehouse->id,
                        'product_id' => $targetProduct->id,
                        'quantity' => $qty,
                        'type' => 'transfer_in',
                        'reference_type' => Product::class,
                        'reference_id' => $sourceProduct->id
                    ]);
                }
            }

            $sourceProduct->update([
                'merged_into_id' => $targetProduct->id,
                'merged_at' => now(),
                'status' => 'merged'
            ]);

            $sourceProduct->delete(); // Soft Delete
        });

        return response()->json(['message' => 'Produits fusionnés avec succès.']);
    }

    public function unpack(Request $request, Product $product)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|integer|min:1',
            'unit_count' => 'required|integer|min:1'
        ]);

        $warehouseId = $request->warehouse_id;
        $qtyToOpen = $request->quantity;
        $unitCount = $request->unit_count;
        $resultQty = $qtyToOpen * $unitCount;

        // Find or Create Target Product
        $targetName = "(Détail) " . $product->designation;
        $targetProduct = Product::where('designation', $targetName)->first();

        if (!$targetProduct) {
            $sellingPrice = $product->selling_price > 0 ? ($product->selling_price / $unitCount) : 0;
            $buyingPrice = $product->buying_price > 0 ? ($product->buying_price / $unitCount) : 0;

            // Auto-increment barcode
            $maxBarcode = Product::whereRaw("barcode REGEXP '^[0-9]+$'")->max(DB::raw('CAST(barcode AS UNSIGNED)'));
            $barcode = $maxBarcode ? strval($maxBarcode + 1) : '100000100000';

            $targetProduct = Product::create([
                'designation' => $targetName,
                'sku' => 'ART-' . time() . '-' . rand(100, 999),
                'barcode' => $barcode,
                'category_id' => $product->category_id,
                'shelf_id' => $product->shelf_id,
                'supplier_id' => $product->supplier_id,
                'buying_price' => number_format($buyingPrice, 2, '.', ''),
                'selling_price' => number_format($sellingPrice, 2, '.', ''),
                'tva' => $product->tva,
                'color' => $product->color,
                'status' => 'active',
                'parent_id' => $product->id,
                'conversion_rate' => $unitCount,
                'created_by' => Auth::id(),
            ]);
        } else {
            // Ensure hierarchy is established for existing products
            $targetProduct->update([
                'parent_id' => $product->id,
                'conversion_rate' => $unitCount
            ]);
        }

        DB::transaction(function () use ($product, $targetProduct, $warehouseId, $qtyToOpen, $resultQty) {
            // Check source stock
            $sourcePivot = $product->warehouses()->where('warehouse_id', $warehouseId)->first();

            if (!$sourcePivot || $sourcePivot->pivot->stock_actuel < $qtyToOpen) {
                throw new \Exception("Stock insuffisant pour le déconditionnement.");
            }

            // Decrease source
            $product->warehouses()->updateExistingPivot($warehouseId, [
                'stock_actuel' => $sourcePivot->pivot->stock_actuel - $qtyToOpen
            ]);

            // Log Source Movement
            \App\Models\StockMovement::create([
                'warehouse_id' => $warehouseId,
                'product_id' => $product->id,
                'quantity' => -$qtyToOpen,
                'type' => 'unpack_out',
                'reference_type' => Product::class,
                'reference_id' => $targetProduct->id
            ]);

            // Increase target
            $targetPivot = $targetProduct->warehouses()->where('warehouse_id', $warehouseId)->first();
            if ($targetPivot) {
                $targetProduct->warehouses()->updateExistingPivot($warehouseId, [
                    'stock_actuel' => $targetPivot->pivot->stock_actuel + $resultQty
                ]);
            } else {
                $targetProduct->warehouses()->attach($warehouseId, [
                    'stock_actuel' => $resultQty,
                    'stock_alerte' => 0
                ]);
            }

            // Log Target Movement
            \App\Models\StockMovement::create([
                'warehouse_id' => $warehouseId,
                'product_id' => $targetProduct->id,
                'quantity' => $resultQty,
                'type' => 'unpack_in',
                'reference_type' => Product::class,
                'reference_id' => $product->id
            ]);
        });

        return response()->json([
            'message' => 'Déconditionnement effectué avec succès.',
            'target_product' => $targetProduct
        ]);
    }

    public function stats(Request $request, $id)
    {
        $product = Product::withTrashed()->with(['creator', 'mergedInto'])->findOrFail($id);

        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
        ]);

        $start = $request->start_date ?? now()->subMonth();
        $end = $request->end_date ?? now();

        // Stock History (Movements)
        $movements = \App\Models\StockMovement::where('product_id', $product->id)
            ->with(['warehouse', 'reference']) // Add reference relationship to StockMovement later if needed
            ->latest()
            ->limit(50)
            ->get();

        // Graph Data: Daily aggregate of 'sale' movements
        // For simplicity, we just aggregate output movements by day
        $graphData = \App\Models\StockMovement::where('product_id', $product->id)
            ->whereIn('type', ['sale', 'out'])
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, SUM(ABS(quantity)) as total_qty')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'product' => $product,
            'movements' => $movements,
            'graph_data' => $graphData,
            'merged_info' => $product->merged_into_id ? $product->mergedInto : null,
            'stats' => [
                'total_sales' => $product->stockMovements()->where('type', 'sale')->sum(DB::raw('ABS(quantity)')),
                'current_stock' => $product->warehouses->sum('pivot.stock_actuel')
            ]
        ]);
    }

    public function reactivate($id)
    {
        $product = Product::withTrashed()->findOrFail($id);

        if ($product->merged_into_id) {
            // Optional: warn or reset merged flag?
            // For now, just restore it.
            $product->update(['merged_into_id' => null, 'merged_at' => null]);
        }

        $product->update(['status' => 'active']);
        $product->restore();

        return response()->json(['message' => 'Produit réactivé avec succès.']);
    }

    public function unpackingHistory(Request $request)
    {
        // 1. Configurations (Global List of Parent-Child links)
        $configurations = Product::whereNotNull('parent_id')
            ->whereNotNull('conversion_rate')
            ->with([
                'parent' => function ($q) {
                    $q->withTrashed();
                },
                'category'
            ])
            ->get()
            ->map(function ($product) {
                return [
                    'child_id' => $product->id,
                    'child_name' => $product->designation,
                    'parent_id' => $product->parent_id,
                    'parent_name' => $product->parent ? $product->parent->designation : 'N/A',
                    'conversion_rate' => $product->conversion_rate,
                    'category' => $product->category ? $product->category->name : 'N/A'
                ];
            });

        // 2. History (Movements)
        $start = $request->start_date;
        $end = $request->end_date;

        $history = \App\Models\StockMovement::with([
            'product' => function ($q) {
                $q->withTrashed();
            }
        ])
            ->whereIn('type', ['unpack_in', 'auto_unpack_in'])
            ->when($start, fn($q) => $q->whereDate('created_at', '>=', $start))
            ->when($end, fn($q) => $q->whereDate('created_at', '<=', $end))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($movement) {
                $parentName = 'N/A';

                if ($movement->type === 'unpack_in' && $movement->reference_type === Product::class) {
                    $parent = Product::withTrashed()->find($movement->reference_id);
                    $parentName = $parent ? $parent->designation : 'Unknown Parent';
                } elseif ($movement->type === 'auto_unpack_in') {
                    $parent = $movement->product->parent;
                    if (!$parent && $movement->product->parent_id) {
                        $parent = Product::withTrashed()->find($movement->product->parent_id);
                    }
                    $parentName = $parent ? $parent->designation : 'Unknown Parent (Auto)';
                }

                return [
                    'id' => $movement->id,
                    'date' => $movement->created_at->toDateTimeString(),
                    'type' => $movement->type === 'auto_unpack_in' ? 'Automatique (Caisse)' : 'Manuel',
                    'child_product' => $movement->product ? $movement->product->designation : 'Unknown Child',
                    'quantity_created' => $movement->quantity,
                    'parent_product' => $parentName,
                    'warehouse_id' => $movement->warehouse_id
                ];
            });

        return response()->json([
            'configurations' => $configurations,
            'history' => $history
        ]);
    }
    public function destroy(Product $product)
    {
        // Check total stock across all warehouses
        $totalStock = $product->warehouses->sum('pivot.stock_actuel');

        if ($totalStock > 0) {
            return response()->json([
                'message' => 'Impossible de supprimer un produit avec du stock positif.'
            ], 422);
        }

        $product->delete();

        return response()->json(['message' => 'Produit supprimé avec succès.']);
    }
}



