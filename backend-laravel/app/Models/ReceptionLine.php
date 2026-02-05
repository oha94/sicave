<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\HasUuid;

class ReceptionLine extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['stock_reception_id', 'product_id', 'quantity', 'unit_price', 'expiry_date'];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function reception(): BelongsTo
    {
        return $this->belongsTo(StockReception::class, 'stock_reception_id');
    }
}
