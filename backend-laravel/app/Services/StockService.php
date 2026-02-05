<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Warehouse;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Ensure enough stock exists for a product by recursively unpacking parents if necessary.
     * This method executes actual DB updates for unpacking movements.
     * 
     * @param Product $product
     * @param Warehouse $warehouse
     * @param int $quantityNeeded
     * @param string $referenceType
     * @param string|int $referenceId
     * @throws \Exception If stock is insufficient even after unpacking attempts.
     */
    public function ensureStock(Product $product, Warehouse $warehouse, $quantityNeeded, $referenceType = null, $referenceId = null)
    {
        $pivot = $warehouse->products()->where('product_id', $product->id)->first();
        $currentStock = $pivot ? $pivot->pivot->stock_actuel : 0;

        \Illuminate\Support\Facades\Log::info("Stock Check for Product {$product->designation} (ID: {$product->id}) in Warehouse {$warehouse->nom} (ID: {$warehouse->id}): Current: $currentStock, Needed: $quantityNeeded");

        if ($currentStock >= $quantityNeeded) {
            return; // Enough stock, no action needed.
        }

        // Calculate missing quantity
        $missing = $quantityNeeded - $currentStock;

        // Check if we can unpack from parent
        if ($product->parent_id && $product->conversion_rate > 0) {
            $parentsNeeded = (int) ceil($missing / $product->conversion_rate);
            $parentProduct = Product::find($product->parent_id);

            if ($parentProduct) {
                // RECURSIVE CALL: Ensure parent has enough stock
                $this->ensureStock($parentProduct, $warehouse, $parentsNeeded, $referenceType, $referenceId);

                // If we are here, parent has enough stock (or threw exception).
                // Perform Unpacking
                $this->unpack($parentProduct, $product, $warehouse, $parentsNeeded, $referenceType, $referenceId);

                return; // Stock should now be sufficient
            }
        }

        // If no parent or parent chain failed (though recursion throws), fail here.
        throw new \Exception("Stock insuffisant pour le produit '{$product->designation}' (Manque: {$missing}).");
    }

    /**
     * Perform the unpacking of a specific quantity of parent items into child items.
     */
    protected function unpack(Product $parent, Product $child, Warehouse $warehouse, $qtyParent, $referenceType, $referenceId)
    {
        $qtyChild = $qtyParent * $child->conversion_rate;

        // 1. Decrease Parent Stock
        $parentPivot = $warehouse->products()->where('product_id', $parent->id)->first();
        // We assume stock exists because ensureStock called before
        $warehouse->products()->updateExistingPivot($parent->id, [
            'stock_actuel' => $parentPivot->pivot->stock_actuel - $qtyParent
        ]);

        StockMovement::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $parent->id,
            'quantity' => -$qtyParent,
            'type' => 'auto_unpack_out',
            'reference_type' => $referenceType,
            'reference_id' => $referenceId
        ]);

        // 2. Increase Child Stock
        $childPivot = $warehouse->products()->where('product_id', $child->id)->first();
        if ($childPivot) {
            $warehouse->products()->updateExistingPivot($child->id, [
                'stock_actuel' => $childPivot->pivot->stock_actuel + $qtyChild
            ]);
        } else {
            $warehouse->products()->attach($child->id, [
                'stock_actuel' => $qtyChild,
                'stock_alerte' => 0
            ]);
        }

        StockMovement::create([
            'warehouse_id' => $warehouse->id,
            'product_id' => $child->id,
            'quantity' => $qtyChild,
            'type' => 'auto_unpack_in',
            'reference_type' => $referenceType,
            'reference_id' => $referenceId
        ]);
    }
}
