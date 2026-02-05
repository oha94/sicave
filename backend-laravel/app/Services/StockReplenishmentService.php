<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Product;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StockReplenishmentService
{
    /**
     * Calculate average daily sales velocity for products in a warehouse.
     * Based on last 30 days of sales.
     */
    public function calculateVelocity($warehouseId, $days = 30)
    {
        $startDate = Carbon::now()->subDays($days);

        $sales = InvoiceLine::join('invoices', 'invoice_lines.invoice_id', '=', 'invoices.id')
            ->where('invoices.warehouse_id', $warehouseId)
            ->whereIn('invoices.status', ['validated', 'paid'])
            ->where('invoices.created_at', '>=', $startDate)
            ->select('invoice_lines.product_id', DB::raw('SUM(invoice_lines.quantity) as total_sold'))
            ->groupBy('invoice_lines.product_id')
            ->get()
            ->keyBy('product_id');

        $velocity = [];
        foreach ($sales as $productId => $data) {
            $velocity[$productId] = $data->total_sold / $days;
        }

        return $velocity;
    }

    /**
     * Generate replenishment suggestions for a warehouse.
     * Logic:
     * 1. Calculate Velocity (ADS - Average Daily Sales).
     * 2. If Stock <= Alert Threshold -> Trigger Reorder.
     * 3. Suggested Qty = (Velocity * TargetDays) - CurrentStock.
     */
    public function getReplenishmentSuggestions($warehouseId, $targetCoverageDays = 30)
    {
        $warehouse = Warehouse::with([
            'products' => function ($q) use ($warehouseId) {
                $q->withPivot('stock_actuel', 'stock_alerte');
            }
        ])->findOrFail($warehouseId);

        $velocities = $this->calculateVelocity($warehouseId);
        $suggestions = [];

        foreach ($warehouse->products as $product) {
            $stock = $product->pivot->stock_actuel ?? 0;
            $alert = $product->pivot->stock_alerte ?? 0;
            $velocity = $velocities[$product->id] ?? 0;

            // Trigger condition: Stock is at or below alert level
            // OR if we want to be proactive: if stock coverage < lead time (not implemented yet)
            // For now, strict adherence to user plan: use stock_alerte.

            // However, even if not strictly below alert, if velocity is high and stock is low, we might show it.
            // Strict rule from plan: "A product is flagged for reorder if Current Stock <= Stock Alerte"

            if ($stock <= $alert) {
                $targetStock = $velocity * $targetCoverageDays;
                $suggestedQty = $targetStock - $stock;

                if ($suggestedQty > 0) {
                    $suggestions[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->designation,
                        'sku' => $product->sku,
                        'stock_actuel' => $stock,
                        'stock_alerte' => $alert,
                        'velocity_30d' => round($velocity, 3), // daily sales
                        'monthly_forecast' => round($velocity * 30, 2),
                        'suggested_quantity' => ceil($suggestedQty), // round up to whole unit
                        'supplier_id' => $product->supplier_id, // Default supplier if any
                    ];
                }
            }
        }

        return $suggestions;
    }
}
