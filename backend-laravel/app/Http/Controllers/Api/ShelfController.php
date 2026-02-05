<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Shelf;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ShelfController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Shelf::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:shelves,name',
            'description' => 'nullable|string'
        ]);

        $shelf = Shelf::create($validated);

        return new JsonResource($shelf);
    }

    public function show(Shelf $shelf)
    {
        return new JsonResource($shelf);
    }

    public function update(Request $request, Shelf $shelf)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:shelves,name,' . $shelf->id,
            'description' => 'nullable|string'
        ]);

        $shelf->update($validated);

        return new JsonResource($shelf);
    }

    public function destroy(Shelf $shelf)
    {
        if ($shelf->products()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer un rayon contenant des produits.'], 422);
        }

        $shelf->delete();

        return response()->json(['message' => 'Rayon supprimé avec succès.']);
    }
}
