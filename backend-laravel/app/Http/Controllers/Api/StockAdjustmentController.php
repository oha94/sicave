<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class StockAdjustmentController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse_id' => 'required|exists:warehouses,id',
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:adjustment_in,adjustment_out',
            'quantity' => 'required|numeric|min:0.001',
            'reason' => 'required|string|max:255'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $warehouseId = $validated['warehouse_id'];
        $productId = $validated['product_id'];
        $qty = $validated['quantity'];
        $isEntry = $validated['type'] === 'adjustment_in';
        $signedQty = $isEntry ? $qty : -$qty;

        $product = Product::findOrFail($productId);

        DB::transaction(function () use ($warehouseId, $product, $signedQty, $validated) {
            // 1. Get current stock pivot
            $pivot = $product->warehouses()->where('warehouse_id', $warehouseId)->first();
            $currentStock = $pivot ? $pivot->pivot->stock_actuel : 0;

            // Check for negative stock on exit (Strict Mode)
            if ($signedQty < 0 && ($currentStock + $signedQty < 0)) {
                throw new \Exception("Stock insuffisant pour cette régularisation (Stock actuel: $currentStock)");
            }

            // 2. Create Adjustment Record (The Header)
            $adjustment = \App\Models\StockAdjustment::create([
                'user_id' => auth()->id() ?? \App\Models\User::first()->id, // Fallback if auth missing in dev
                'warehouse_id' => $warehouseId,
                'reason' => $validated['reason']
            ]);

            // 3. Create Movement (The Line)
            StockMovement::create([
                'warehouse_id' => $warehouseId,
                'product_id' => $product->id,
                'quantity' => $signedQty,
                'type' => $validated['type'],
                'reference_type' => \App\Models\StockAdjustment::class,
                'reference_id' => $adjustment->id
            ]);

            // 4. Update Stock
            if ($pivot) {
                $product->warehouses()->updateExistingPivot($warehouseId, [
                    'stock_actuel' => $currentStock + $signedQty
                ]);
            } else {
                // If entry for new product in warehouse
                if ($signedQty > 0) {
                    $product->warehouses()->attach($warehouseId, [
                        'stock_actuel' => $signedQty,
                        'stock_alerte' => 0
                    ]);
                } else {
                    throw new \Exception("Impossible de sortir un produit inexistant dans cet entrepot.");
                }
            }
        });

        return response()->json(['message' => 'Régularisation effectuée avec succès.']);
    }
}
