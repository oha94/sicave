<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Exception;

class InventoryService
{
    /**
     * Traiter les ajustements d'un inventaire.
     * Met à jour le stock réel pour correspondre à l'inventaire.
     */
    public function processAdjustment(Inventory $inventory): void
    {
        if ($inventory->status === 'completed') {
            throw new Exception("Cet inventaire est déjà clôturé.");
        }

        DB::transaction(function () use ($inventory) {
            foreach ($inventory->lines as $line) {
                // Gap = Real - Theoretical
                // If Real (8) < Theo (10) => Gap = -2 (We lost 2 -> adjustment_out)
                // If Real (12) > Theo (10) => Gap = +2 (We found 2 -> adjustment_in)
                $gap = $line->stock_real - $line->stock_theoretical;

                // Update line with final calculated gap
                $line->update(['gap' => $gap]);

                if ($gap != 0) {
                    $type = $gap > 0 ? 'adjustment_in' : 'adjustment_out';

                    // Create Stock Movement
                    StockMovement::create([
                        'warehouse_id' => $inventory->warehouse_id,
                        'product_id' => $line->product_id,
                        'quantity' => abs($gap), // Mouvements are usually absolute quantity, type defines direction? 
                        // In StockAdjustmentController we used signed quantity.
                        // However, standard convention often uses signed for calculation but absolute for records if type is explicit.
                        // Let's check StockAdjustmentController from previous turn. 
                        // "signedQty = $isEntry ? $qty : -$qty;" and then "StockMovement::create([ ... 'quantity' => $signedQty ...])"
                        // So StockMovement expects SIGNED quantity.
                        'quantity' => $gap,
                        'type' => $type,
                        'reference_type' => Inventory::class,
                        'reference_id' => $inventory->id,
                    ]);

                    // Update Warehouse Stock 
                    // We force the stock to the REAL count found during inventory
                    DB::table('warehouse_product')
                        ->updateOrInsert(
                            ['warehouse_id' => $inventory->warehouse_id, 'product_id' => $line->product_id],
                            ['stock_actuel' => $line->stock_real, 'updated_at' => now()]
                        );
                }
            }

            $inventory->update(['status' => 'completed']);
        });
    }
}
