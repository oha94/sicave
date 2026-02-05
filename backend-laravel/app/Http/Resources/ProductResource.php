<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $marginValue = ($this->selling_price && $this->buying_price)
            ? $this->selling_price - $this->buying_price
            : 0;

        $marginPercent = ($this->selling_price > 0 && $marginValue > 0)
            ? round(($marginValue / $this->selling_price) * 100, 2)
            : 0;

        return [
            'id' => $this->id,
            'designation' => $this->designation,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'category' => $this->category ? ['id' => $this->category->id, 'name' => $this->category->name] : null,
            'shelf' => $this->shelf ? ['id' => $this->shelf->id, 'name' => $this->shelf->name] : null,
            'supplier' => $this->supplier ? ['id' => $this->supplier->id, 'name' => $this->supplier->nom] : null, // 'nom' from Supplier model
            'buying_price' => (float) $this->buying_price,
            'selling_price' => (float) $this->selling_price,
            'tva' => (float) $this->tva,
            'margin_value' => $marginValue,
            'margin_percent' => $marginPercent,
            'color' => $this->color,
            'status' => $this->status,
            'stock_total' => $this->warehouses->sum('pivot.stock_actuel'),
            'creator' => $this->creator ? $this->creator->name : 'N/A',
            'created_at' => $this->created_at->toIso8601String(),
            'updated_at' => $this->updated_at->toIso8601String(),
            'parent_id' => $this->parent_id,
            'conversion_rate' => $this->conversion_rate,
            'parent' => $this->when($this->parent_id, function () {
                return [
                    'id' => $this->parent->id,
                    'designation' => $this->parent->designation,
                    'warehouses' => $this->parent->warehouses->map(fn($w) => [
                        'id' => $w->id,
                        'stock' => $w->pivot->stock_actuel
                    ])
                ];
            }),
            'warehouses' => $this->warehouses->filter(function ($w) use ($request) {
                // Filter warehouses: If Admin, show all. If User, show only assigned.
                $user = $request->user();
                if (!$user || $user->role === 'admin') {
                    return true;
                }
                // Check if warehouse ID is in user's allowed list
                // We rely on relation being loaded or check ids.
                // Optimally: return $user->warehouses->contains('id', $w->id);
                // But efficient checking:
                static $allowedIds = null;
                if ($allowedIds === null) {
                    $allowedIds = $user->warehouses()->pluck('warehouses.id')->toArray();
                }
                return in_array($w->id, $allowedIds);
            })->map(fn($w) => [
                    'id' => $w->id,
                    'name' => $w->nom,
                    'stock' => $w->pivot->stock_actuel,
                    'alert' => $w->pivot->stock_alerte
                ])->values(), // Reset keys
        ];
    }
}
