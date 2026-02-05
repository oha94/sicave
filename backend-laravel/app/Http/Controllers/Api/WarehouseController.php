<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->role === 'admin') {
            return Warehouse::all();
        }

        return $user->warehouses;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255',
            'type' => 'required|in:warehouse,store',
            'adresse' => 'nullable|string'
        ]);

        return Warehouse::create($validated);
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'nom' => 'string|max:255',
            'type' => 'in:warehouse,store',
            'adresse' => 'nullable|string'
        ]);

        $warehouse->update($validated);
        return $warehouse;
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();
        return response()->noContent();
    }
}
