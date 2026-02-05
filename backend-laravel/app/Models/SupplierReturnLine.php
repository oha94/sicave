<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierReturnLine extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'supplier_return_id',
        'product_id',
        'quantity',
        'reason'
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplierReturn()
    {
        return $this->belongsTo(SupplierReturn::class);
    }
}
