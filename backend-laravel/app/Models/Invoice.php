<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Payment;

class Invoice extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = [
        'client_id',
        'user_id',
        'warehouse_id',
        'reference',
        'type',
        'status',
        'total_ht',
        'total_tax',
        'total_ttc',
        'due_date',
        'dgi_reference',
        'dgi_token',
        'dgi_qr_url',
        'dgi_synced_at',
        'payment_method',
        'paid_amount', // Added
        'payment_status' // Added
    ];

    protected $casts = [
        'due_date' => 'date',
        'dgi_synced_at' => 'datetime',
        'total_ht' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_ttc' => 'decimal:2',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(InvoiceLine::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function getRemainingAmountAttribute()
    {
        return $this->total_ttc - $this->paid_amount;
    }
}
