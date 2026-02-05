<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PurchaseOrder extends Model
{
    use HasFactory, SoftDeletes, HasUuids;

    protected $fillable = [
        'reference',
        'supplier_id',
        'warehouse_id',
        'user_id',
        'status',
        'date',
        'expected_date',
        'total_ht',
        'total_tax',
        'total_ttc',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
        'expected_date' => 'date',
        'total_ht' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lines()
    {
        return $this->hasMany(PurchaseOrderLine::class);
    }
}
