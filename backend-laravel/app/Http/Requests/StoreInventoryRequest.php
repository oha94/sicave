<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => 'required|exists:warehouses,id',
            'type' => 'required|in:full,partial',
            'lines' => 'array',
            'lines.*.product_id' => 'required|exists:products,id',
            'lines.*.stock_real' => 'required|numeric',
            'lines.*.stock_theoretical' => 'nullable|numeric', // Idéalement on devrait le calculer côté backend
        ];
    }
}
