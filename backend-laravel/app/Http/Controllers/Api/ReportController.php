<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WorkDay;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\CashCount;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Helper to get Date Range
     */
    private function getDateRange(Request $request)
    {
        if ($request->has('work_date')) {
            $date = $request->work_date;
            return [$date, $date];
        }

        $startDate = $request->start_date ?? Carbon::today()->toDateString();
        $endDate = $request->end_date ?? Carbon::today()->toDateString();

        return [$startDate, $endDate];
    }

    /**
     * 1. Journal de Caisse
     * Ventes et Paiements par opérateur et mode
     */
    public function cashJournal(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        // Payments (Encaissements)
        $paymentsQuery = Payment::with('user')
            ->whereBetween('work_date', [$start, $end]);

        if ($request->user_id)
            $paymentsQuery->where('user_id', $request->user_id);
        if ($request->payment_method)
            $paymentsQuery->where('payment_method', $request->payment_method);

        $payments = $paymentsQuery->select('payment_method', 'user_id', DB::raw('SUM(amount) as total'))
            ->groupBy('payment_method', 'user_id')
            ->get()
            ->map(function ($p) {
                return [
                    'type' => 'in',
                    'method' => $p->payment_method,
                    'operator' => $p->user->name ?? 'Inconnu',
                    'amount' => $p->total
                ];
            });

        // Expenses (Décaissements)
        $expensesQuery = Expense::with('user')
            ->whereBetween('work_date', [$start, $end]);

        if ($request->user_id)
            $expensesQuery->where('user_id', $request->user_id);
        // Expenses might not have exact payment_method column, usually 'type' works as category
        // If strict payment_method filter is needed for expenses, check structure. 
        // For now, let's skip payment_method filter on expenses or map it if valid.

        $expenses = $expensesQuery->select('type as method', 'user_id', DB::raw('SUM(amount) as total'))
            ->groupBy('type', 'user_id')
            ->get()
            ->map(function ($e) {
                return [
                    'type' => 'out',
                    'method' => $e->method,
                    'operator' => $e->user->name ?? 'Inconnu',
                    'amount' => $e->total
                ];
            });

        return response()->json([
            'range' => ['start' => $start, 'end' => $end],
            'journal' => $payments->merge($expenses)
        ]);
    }

    /**
     * 2. Résumé de Versements
     */
    public function cashCounts(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $counts = CashCount::with('user')
            ->whereBetween('work_date', [$start, $end])
            ->latest('date')
            ->get();

        return response()->json($counts);
    }

    /**
     * 3. Décaissements Détails
     */
    public function expenses(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $expenses = Expense::with('user')
            ->whereBetween('work_date', [$start, $end])
            ->latest('date')
            ->get();

        return response()->json($expenses);
    }

    /**
     * 4. Factures Client (Balances)
     */
    public function clientBalances(Request $request)
    {
        // Snapshot status logic usually doesn't depend on date range for "current debt",
        // but if we want historic view it's complex.
        // For now, return Current Status of all clients with debts.

        $clients = \App\Models\Client::with([
            'invoices' => function ($q) {
                $q->select('id', 'client_id', 'total_ttc', 'paid_amount', 'created_at', 'reference')
                    ->whereRaw('total_ttc > paid_amount');
            }
        ])
            ->get()
            ->map(function ($client) {
                $debt = $client->invoices->sum(function ($inv) {
                    return $inv->total_ttc - $inv->paid_amount;
                });
                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'phone' => $client->phone,
                    'total_debt' => $debt,
                    'invoices_count' => $client->invoices->count()
                ];
            })
            ->filter(function ($c) {
                return $c['total_debt'] > 0;
            })
            ->values();

        return response()->json($clients);
    }

    /**
     * 5. Synthèse Financière (Total Ventes, Total Encaissé, Total Sortie)
     */
    public function financialSummary(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        // Ventes (Factures Validées)
        $validInvoices = Invoice::whereBetween('work_date', [$start, $end])
            ->where('status', 'validated');

        if ($request->user_id)
            $validInvoices->where('user_id', $request->user_id);
        if ($request->payment_method)
            $validInvoices->where('payment_method', $request->payment_method);

        $totalSalesHT = $validInvoices->sum('total_ht');
        $totalSalesTTC = $validInvoices->sum('total_ttc');

        // Encaissements (Payments)
        $paymentsQ = Payment::whereBetween('work_date', [$start, $end]);
        if ($request->user_id)
            $paymentsQ->where('user_id', $request->user_id);
        if ($request->payment_method)
            $paymentsQ->where('payment_method', $request->payment_method);
        $totalIn = $paymentsQ->sum('amount');

        // Décaissements (Expenses)
        $expensesQ = Expense::whereBetween('work_date', [$start, $end]);
        if ($request->user_id)
            $expensesQ->where('user_id', $request->user_id);
        $totalOut = $expensesQ->sum('amount');

        // Versements (Déclarés)
        $countsQ = CashCount::whereBetween('work_date', [$start, $end]);
        if ($request->user_id)
            $countsQ->where('user_id', $request->user_id);
        $totalDeclared = $countsQ->sum('total_declared');

        return response()->json([
            'sales_ht' => $totalSalesHT,
            'sales_ttc' => $totalSalesTTC,
            'total_collected' => $totalIn,
            'total_expenses' => $totalOut,
            'total_declared' => $totalDeclared,
            'theoretical_balance' => $totalIn - $totalOut,
            'real_gap' => $totalDeclared - ($totalIn - $totalOut)
            // Note: Gap calculation here is approximate aggregating all methods. 
            // Better to look at CashCount individual records for precise gaps.
        ]);
    }

    /**
     * 5b. Points de Vente (Synthèse par Entrepôt/Magasin)
     */
    public function financialPointsOfSale(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $warehouses = \App\Models\Warehouse::with([
            'invoices' => function ($q) use ($start, $end) {
                // Assuming 'work_date' is on invoices, or use created_at
                $q->whereBetween('work_date', [$start, $end])
                    ->where('status', 'validated');
            }
        ])
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    'name' => $w->nom,
                    'type' => $w->type,
                    'sales_count' => $w->invoices->count(),
                    'total_sales' => $w->invoices->sum('total_ttc'),
                ];
            });

        return response()->json($warehouses);
    }

    // --- STOCK REPORTS ---

    /**
     * 6. Stock Assets & Value (Valeur & Pyramide)
     */
    public function stockValue(Request $request)
    {
        // Snapshot or Current? Current for now.
        $query = \App\Models\Product::with(['category', 'supplier', 'warehouses']);

        if ($request->category_id)
            $query->where('category_id', $request->category_id);
        if ($request->supplier_id)
            $query->where('supplier_id', $request->supplier_id);
        // Warehouse filter affects which pivot value we take or if we include the product at all.
        // For simplicity: If warehouse_id is sent, we filter products that exist in that warehouse?
        // Or deeper: we only sum stock from that warehouse.
        $warehouseId = $request->warehouse_id;

        $products = $query->get()
            ->map(function ($p) use ($warehouseId) {
                // Determine stock based on warehouse filter
                $stock = 0;
                if ($warehouseId) {
                    $w = $p->warehouses->firstWhere('id', $warehouseId);
                    $stock = $w ? $w->pivot->stock_actuel : 0;
                } else {
                    $stock = $p->warehouses->sum('pivot.stock_actuel');
                }

                $value = $stock * $p->unit_price;

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'category' => $p->category->name ?? 'N/A',
                    'supplier' => $p->supplier->name ?? 'N/A',
                    'stock' => $stock,
                    'price' => $p->unit_price,
                    'value' => $value
                ];
            })
            ->filter(function ($p) {
                // Optional: Hide items with 0 stock if filtered? 
                // Let's keep them but maybe sort issues.
                return true;
            });

        $byCategory = $products->groupBy('category')->map(function ($items, $cat) {
            return [
                'name' => $cat,
                'count' => $items->count(),
                'value' => $items->sum('value')
            ];
        })->values();

        return response()->json([
            'products' => $products->sortByDesc('value')->values()->take(50), // Pyramid top 50
            'by_category' => $byCategory,
            'total_value' => $products->sum('value'),
            'total_items' => $products->sum('stock')
        ]);
    }

    /**
     * 7. Stock Movements (Sorties, Historique)
     */
    public function stockMovements(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);
        $type = $request->type; // optional filter 'out', 'in'

        $query = \App\Models\StockMovement::with(['product', 'user'])
            ->whereBetween('created_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()])
            ->latest();

        if ($type === 'out') {
            $query->where('quantity', '<', 0);
        }

        if ($request->user_id)
            $query->where('user_id', $request->user_id);

        if ($request->category_id) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('category_id', $request->category_id);
            });
        }

        if ($request->warehouse_id)
            $query->where('warehouse_id', $request->warehouse_id);

        return response()->json($query->get());
    }

    /**
     * 8. Dormant Stock (Non sortis)
     */
    public function stockDormant(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        // Products that have NO 'out' movement in range
        $products = \App\Models\Product::whereDoesntHave('stockMovements', function ($q) use ($start, $end) {
            $q->where('quantity', '<', 0)
                ->whereBetween('created_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()]);
        })->with('warehouses')->get();

        return response()->json($products->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'stock' => $p->warehouses->sum('pivot.stock_actuel'),
                'last_movement' => $p->stockMovements()->latest()->first()?->created_at
            ];
        }));
    }

    /**
     * 9. Alerts (Ruptures)
     */
    public function stockAlerts(Request $request)
    {
        // Simple logic: stock_actuel < stock_alerte
        // We need to check pivots.
        // Get warehouses with products where stock < alert

        $alerts = [];
        $warehouses = \App\Models\Warehouse::with([
            'products' => function ($q) {
                $q->whereRaw('product_warehouse.stock_actuel <= product_warehouse.stock_alerte');
            }
        ])->get();

        foreach ($warehouses as $w) {
            foreach ($w->products as $p) {
                $alerts[] = [
                    'warehouse' => $w->name,
                    'product' => $p->name,
                    'current' => $p->pivot->stock_actuel,
                    'alert' => $p->pivot->stock_alerte
                ];
            }
        }

        return response()->json($alerts);
    }

    /**
     * 10. Inventories (Inventaires & Ecarts)
     */
    public function stockInventories(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $query = \App\Models\Inventory::with(['warehouse', 'creator'])
            ->whereBetween('validated_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()])
            ->latest('validated_at');

        if ($request->warehouse_id)
            $query->where('warehouse_id', $request->warehouse_id);
        if ($request->user_id)
            $query->where('created_by', $request->user_id);

        return response()->json($query->get()->map(function ($inv) {
            return [
                'id' => $inv->id,
                'date' => $inv->validated_at,
                'reference' => $inv->reference,
                'warehouse' => $inv->warehouse->nom ?? 'N/A',
                'user' => $inv->creator->name ?? 'N/A',
                'status' => $inv->status,
                'total_gap' => $inv->total_value_gap, // Assuming migration has this or we compute it
                'items_count' => $inv->lines_count ?? 0 // If using withCount or simple count
            ];
        }));
    }

    // --- AUDIT REPORTS ---

    /**
     * 10. Audit: Price Changes
     */
    public function auditPriceChanges(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $logs = \App\Models\AuditLog::with('user')
            ->where('action', 'price_update')
            ->whereBetween('created_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()])
            ->latest()
            ->get()
            ->map(function ($log) {
                // Fetch product name if possible, or use metadata/description
                // Ideally we eager load entity if polymorphic relations set up correctly
                // For now, let's rely on entity_id lookup or description
                $productName = \App\Models\Product::find($log->entity_id)?->name ?? 'Article supprimé';
                return [
                    'id' => $log->id,
                    'date' => $log->created_at,
                    'user' => $log->user->name ?? 'Système',
                    'product_name' => $productName,
                    'old_price' => $log->old_values['unit_price'] ?? 'N/A',
                    'new_price' => $log->new_values['unit_price'] ?? 'N/A',
                ];
            });

        return response()->json($logs);
    }

    /**
     * 11. Audit: Deletions
     */
    public function auditDeletions(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $logs = \App\Models\AuditLog::with('user')
            ->whereIn('action', ['delete', 'invoice_delete'])
            ->whereBetween('created_at', [Carbon::parse($start)->startOfDay(), Carbon::parse($end)->endOfDay()])
            ->latest()
            ->get();

        return response()->json($logs);
    }

    /**
     * 12. Audit: Closures (WorkDays)
     */
    public function auditClosures(Request $request)
    {
        [$start, $end] = $this->getDateRange($request);

        $closures = \App\Models\WorkDay::with(['opener', 'closer'])
            ->whereBetween('date', [$start, $end])
            ->where('status', 'closed')
            ->latest('date')
            ->get();

        return response()->json($closures);
    }
}


