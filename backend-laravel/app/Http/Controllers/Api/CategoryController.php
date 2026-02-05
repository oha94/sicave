<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryController extends Controller
{
    public function index()
    {
        return JsonResource::collection(Category::orderBy('nom')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:categories,nom',
            'description' => 'nullable|string'
        ]);

        $category = Category::create($validated);

        return new JsonResource($category);
    }

    public function show(Category $category)
    {
        return new JsonResource($category);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:categories,nom,' . $category->id,
            'description' => 'nullable|string'
        ]);

        $category->update($validated);

        return new JsonResource($category);
    }

    public function destroy(Category $category)
    {
        // Optional: Check if products exist in this category before deleting
        if ($category->products()->exists()) {
            return response()->json(['message' => 'Impossible de supprimer une catégorie contenant des produits.'], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Catégorie supprimée avec succès.']);
    }
}
