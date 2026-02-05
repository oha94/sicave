<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StockReception extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['supplier_id', 'warehouse_id', 'reference_externe', 'status'];

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(ReceptionLine::class);
    }
}
