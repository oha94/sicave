<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory; // Assuming HasFactory is also needed as per common Laravel practice and the provided snippet
use App\Traits\HasUuid;

class Supplier extends Model
{
    use HasFactory, HasUuid;

    protected $fillable = ['nom', 'coordonnees'];
}
