<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;

class StockAdjustment extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['user_id', 'warehouse_id', 'reason'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function movements()
    {
        return $this->morphMany(StockMovement::class, 'reference');
    }
}
