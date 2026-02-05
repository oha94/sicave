<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockReception;
use App\Http\Requests\StoreReceptionRequest;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StockReceptionController extends Controller
{
    protected StockService $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = StockReception::with(['supplier', 'warehouse']);

        // Search by Reference or Supplier Name
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('reference_externe', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('nom', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by Date Range
        if ($dateFrom = $request->input('date_from')) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }
        if ($dateTo = $request->input('date_to')) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        // Standard pagination
        $receptions = $query->latest()->paginate(15);

        return response()->json($receptions);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreReceptionRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $reception = StockReception::create([
            'supplier_id' => $validated['supplier_id'],
            'warehouse_id' => $validated['warehouse_id'],
            'reference_externe' => $validated['reference_externe'] ?? null,
            'status' => 'draft',
        ]);

        if (isset($validated['lines'])) {
            // Création des lignes si fournies
            $reception->lines()->createMany($validated['lines']);
        }

        return response()->json($reception->load('lines'), 201);
    }

    public function validateReception(Request $request, StockReception $reception): JsonResponse
    {
        try {
            $this->stockService->validateReception($reception);
            return response()->json(['message' => 'Réception validée avec succès.', 'reception' => $reception->refresh()]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(StockReception $reception): JsonResponse
    {
        return response()->json($reception->load('lines.product', 'warehouse', 'supplier'));
    }
}
