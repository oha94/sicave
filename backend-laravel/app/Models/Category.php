<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\HasUuid;

class Category extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['nom', 'description'];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
