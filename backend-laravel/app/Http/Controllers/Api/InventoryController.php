<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Http\Requests\StoreInventoryRequest;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreInventoryRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Create the Inventory Header
        $inventory = Inventory::create([
            'warehouse_id' => $validated['warehouse_id'],
            'type' => $validated['type'], // 'full', 'partial'
            'status' => 'draft',
        ]);

        // Logic to populate lines based on filters
        // If 'lines' are passed directly (manual partial selection from UI)
        if (isset($validated['lines']) && !empty($validated['lines'])) {
            $inventory->lines()->createMany($validated['lines']);
        }
        // Auto-populate based on type/filters
        else {
            $query = \App\Models\Product::where('status', 'active');

            // Apply Filters if Partial
            if ($validated['type'] === 'partial') {
                if ($request->has('category_id'))
                    $query->where('category_id', $request->category_id);
                if ($request->has('supplier_id'))
                    $query->where('supplier_id', $request->supplier_id);
                if ($request->has('shelf_id'))
                    $query->where('shelf_id', $request->shelf_id);
                // Can add more filters like 'negative_stock_only' etc.
            }

            $products = $query->with([
                'warehouses' => function ($q) use ($validated) {
                    $q->where('warehouse_id', $validated['warehouse_id']);
                }
            ])->get();

            $lines = $products->map(function ($product) use ($validated) {
                // Determine current theoretical stock in this warehouse
                $warehousePivot = $product->warehouses->first();
                $theoretical = $warehousePivot ? $warehousePivot->pivot->stock_actuel : 0;

                return [
                    'product_id' => $product->id,
                    'stock_theoretical' => $theoretical,
                    'stock_real' => $theoretical, // Default to theoretical, user will update
                    'gap' => 0
                ];
            });

            if ($lines->isNotEmpty()) {
                $inventory->lines()->createMany($lines->toArray());
            }
        }

        return response()->json($inventory->load('lines.product'), 201);
    }

    /**
     * Update the specified resource in storage.
     * Permet d'ajouter des lignes ou de mettre à jour le stock réel.
     */
    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        if ($inventory->status === 'completed') {
            return response()->json(['error' => 'Inventaire déjà validé'], 400);
        }

        // Logique simplifiée pour ajouter/màj des lignes via un payload 'lines'
        if ($request->has('lines')) {
            foreach ($request->input('lines') as $lineData) {
                $inventory->lines()->updateOrCreate(
                    ['product_id' => $lineData['product_id']],
                    [
                        'stock_theoretical' => $lineData['stock_theoretical'] ?? 0, // Idéalement calculé auto, mais ici simple
                        'stock_real' => $lineData['stock_real'],
                        'gap' => ($lineData['stock_real'] - ($lineData['stock_theoretical'] ?? 0))
                    ]
                );
            }
        }

        return response()->json($inventory->load('lines'));
    }

    /**
     * Valider l'inventaire.
     */
    public function validateInventory(Inventory $inventory): JsonResponse
    {
        try {
            $this->inventoryService->processAdjustment($inventory);
            return response()->json(['message' => 'Inventaire validé avec succès.', 'inventory' => $inventory->refresh()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Inventory $inventory): JsonResponse
    {
        return response()->json($inventory->load('lines.product', 'warehouse'));
    }
}
