<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderLine;
use App\Services\StockReplenishmentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class PurchaseOrderController extends Controller
{
    protected $replenishmentService;

    public function __construct(StockReplenishmentService $replenishmentService)
    {
        $this->replenishmentService = $replenishmentService;
    }

    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'warehouse', 'user'])
            ->orderBy('created_at', 'desc');

        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        return response()->json($query->paginate(20));
    }

    public function suggestions(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|uuid'
        ]);

        $suggestions = $this->replenishmentService->getReplenishmentSuggestions($request->warehouse_id);

        return response()->json($suggestions);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|uuid',
            'warehouse_id' => 'required|uuid',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|uuid',
            'lines.*.quantity_ordered' => 'required|numeric|min:0.001',
            'lines.*.unit_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            $totalHt = 0;
            // Calculate totals from lines
            foreach ($request->lines as $line) {
                $totalHt += $line['quantity_ordered'] * $line['unit_price'];
            }

            // Simple tax calculation (can be improved)
            $totalTax = 0;
            $totalTtc = $totalHt + $totalTax;

            $po = PurchaseOrder::create([
                'reference' => 'PO-' . date('Ymd') . '-' . strtoupper(uniqid()), // Simple unique ref strategy
                'supplier_id' => $request->supplier_id,
                'warehouse_id' => $request->warehouse_id,
                'user_id' => Auth::id() ?? \App\Models\User::first()->id, // Fallback for dev/testing without auth
                'status' => 'draft',
                'date' => now(),
                'total_ht' => $totalHt,
                'total_tax' => $totalTax,
                'total_ttc' => $totalTtc,
                'notes' => $request->notes ?? null,
            ]);

            foreach ($request->lines as $line) {
                PurchaseOrderLine::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $line['product_id'],
                    'quantity_ordered' => $line['quantity_ordered'],
                    'unit_price' => $line['unit_price'],
                    'total_price' => $line['quantity_ordered'] * $line['unit_price'],
                ]);
            }

            DB::commit();

            return response()->json($po->load('lines'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order Creation Failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $po = PurchaseOrder::with(['lines.product', 'supplier', 'warehouse', 'user'])->findOrFail($id);
        return response()->json($po);
    }

    // Additional methods (update status, receive, etc.) can be added later
}
