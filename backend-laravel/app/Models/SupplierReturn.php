<?php

namespace App\Models;

use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupplierReturn extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'stock_reception_id',
        'warehouse_id',
        'supplier_id',
        'reference',
        'status',
        'total_amount',
        'comments'
    ];

    public function reception()
    {
        return $this->belongsTo(StockReception::class, 'stock_reception_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function lines()
    {
        return $this->hasMany(SupplierReturnLine::class);
    }
}
