<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
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
            'designation' => 'required|string|max:255',
            'sku' => 'nullable|string|unique:products,sku,' . $this->product, // Now nullable in input, handle in controller
            'barcode' => 'nullable|regex:/^\d+$/', // Only numbers
            'category_id' => 'required|exists:categories,id',
            'shelf_id' => 'nullable|exists:shelves,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'buying_price' => 'nullable|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'tva' => 'nullable|numeric|min:0|max:100',
            'color' => 'nullable|string',
        ];
    }
}
