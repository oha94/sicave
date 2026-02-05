<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['nom', 'email', 'telephone', 'adresse', 'type', 'ncc', 'rccm', 'status'];

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
