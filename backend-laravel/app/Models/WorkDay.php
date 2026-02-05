<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkDay extends Model
{
    protected $fillable = [
        'date',
        'status',
        'opened_by',
        'closed_by',
        'closed_at',
        'warehouse_id',
        'final_cash_expected',
        'final_cash_declared',
        'final_cash_gap'
    ];

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function openedBy()
    {
        return $this->belongsTo(User::class, 'opened_by');
    }
}
