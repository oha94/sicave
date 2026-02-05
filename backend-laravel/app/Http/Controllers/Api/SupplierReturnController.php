<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\SupplierReturn;
use App\Models\StockReception;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierReturnController extends Controller
{
    /**
     * Display a listing of the resource.
     * Filter by status ('pending' or 'archived')
     */
    public function index(Request $request)
    {
        $query = SupplierReturn::with(['supplier', 'reception']);

        if ($request->has('status')) {
            // 'pending' (En attente) vs 'completed' (Archived)
            $status = $request->status;
            if ($status === 'archived') {
                $query->whereIn('status', ['completed', 'archived']);
            } else {
                $query->where('status', 'pending');
            }
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhereHas('supplier', fn($sq) => $sq->where('nom', 'like', "%{$search}%"))
                    ->orWhereHas('reception', fn($rq) => $rq->where('reference_externe', 'like', "%{$search}%"));
            });
        }

        return response()->json($query->latest()->paginate(15));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'stock_reception_id' => 'required|exists:stock_receptions,id',
            'comments' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:products,id',
            'lines.*.quantity' => 'required|numeric|min:0.001',
            'lines.*.reason' => 'required|string',
        ]);

        $reception = StockReception::findOrFail($validated['stock_reception_id']);

        // Thorough Validation separate from transaction to fail fast
        foreach ($validated['lines'] as $lineData) {
            $productId = $lineData['product_id'];
            $qtyToReturn = $lineData['quantity'];

            // 1. Verify product was in original reception
            $receptionLine = \App\Models\ReceptionLine::where('stock_reception_id', $reception->id)
                ->where('product_id', $productId)
                ->first();

            if (!$receptionLine) {
                return response()->json([
                    'message' => "Le produit #{$productId} ne figure pas sur ce Bon de Livraison."
                ], 422);
            }

            // 2. Check previously returned quantity
            $alreadyReturned = \App\Models\SupplierReturnLine::whereHas('supplierReturn', function ($q) use ($reception) {
                $q->where('stock_reception_id', $reception->id);
            })->where('product_id', $productId)->sum('quantity');

            // Allow returning only what was received (minus what was already returned)
            $remainingReturnable = $receptionLine->quantity - $alreadyReturned;

            if ($qtyToReturn > $remainingReturnable) {
                return response()->json([
                    'message' => "Impossible de retourner {$qtyToReturn} unités du produit #{$productId}. Maximum restante retournable : {$remainingReturnable} (Reçu: {$receptionLine->quantity}, Déjà retourné: {$alreadyReturned})."
                ], 422);
            }

            // 3. Check current stock in warehouse (Cannot return what you don't have)
            $product = \App\Models\Product::find($productId);
            $stockPivot = $product->warehouses()->where('warehouse_id', $reception->warehouse_id)->first();
            $currentStock = $stockPivot ? $stockPivot->pivot->stock_actuel : 0;

            if ($qtyToReturn > $currentStock) {
                return response()->json([
                    'message' => "Stock insuffisant dans l'entrepôt pour effectuer ce retour. Stock actuel : {$currentStock}, Demandé : {$qtyToReturn}."
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated, $reception) {
            $returnNote = SupplierReturn::create([
                'stock_reception_id' => $reception->id,
                'warehouse_id' => $reception->warehouse_id,
                'supplier_id' => $reception->supplier_id,
                'reference' => 'RET-' . date('Ymd') . '-' . rand(1000, 9999),
                'status' => 'completed', // Direct impact, so marked as completed
                'comments' => $validated['comments'] ?? null,
            ]);

            foreach ($validated['lines'] as $line) {
                // Create Line
                $returnNote->lines()->create([
                    'product_id' => $line['product_id'],
                    'quantity' => $line['quantity'],
                    'reason' => $line['reason']
                ]);

                // Update Stock
                $product = \App\Models\Product::find($line['product_id']);
                $pivot = $product->warehouses()->where('warehouse_id', $reception->warehouse_id)->first();

                // We already checked existence in validation, but safe usage
                if ($pivot) {
                    $product->warehouses()->updateExistingPivot($reception->warehouse_id, [
                        'stock_actuel' => $pivot->pivot->stock_actuel - $line['quantity']
                    ]);
                }

                // Log Movement
                \App\Models\StockMovement::create([
                    'warehouse_id' => $reception->warehouse_id,
                    'product_id' => $line['product_id'],
                    'quantity' => -$line['quantity'],
                    'type' => 'return_out', // Sortie Retour
                    'reference_type' => SupplierReturn::class,
                    'reference_id' => $returnNote->id
                ]);
            }

            return response()->json($returnNote->load('lines'), 201);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(SupplierReturn $supplierReturn)
    {
        return response()->json($supplierReturn->load(['lines.product', 'supplier', 'reception', 'warehouse']));
    }

    /**
     * Update the status (e.g., Mark as Resolved / Archive)
     */
    public function updateStatus(Request $request, SupplierReturn $supplierReturn)
    {
        $request->validate([
            'status' => 'required|in:completed,archived'
        ]);

        // Logic: When marking as completed, we might want to ensure stock is deducted if not already?
        // Assuming simply changing status for now as requested ("passe aux archives").

        $supplierReturn->update(['status' => $request->status]);

        return response()->json(['message' => 'Statut mis à jour.', 'data' => $supplierReturn]);
    }
}
