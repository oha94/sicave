<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;

class Payment extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'client_id',
        'amount',
        'payment_method',
        'reference',
        'notes',
        'user_id',
        'payment_date',
        'work_date'
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }

    public function invoices()
    {
        return $this->belongsToMany(Invoice::class)->withPivot('amount');
    }
}
