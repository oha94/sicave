<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Traits\HasUuid;

class Warehouse extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['nom', 'type', 'adresse'];

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'warehouse_product')
            ->withPivot('stock_actuel', 'stock_alerte')
            ->withTimestamps();
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }
}
