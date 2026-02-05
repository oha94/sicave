<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Invoice;
use App\Models\InvoiceLine;
use App\Models\Warehouse;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\DgiService;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        \Illuminate\Support\Facades\Log::info('Invoice List Request', $request->all());

        $query = Invoice::with(['client', 'lines.product'])->latest();

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by Warehouse Permission
        $user = $request->user();
        if ($user->role !== 'admin') {
            $allowedWarehouseIds = $user->warehouses()->pluck('warehouses.id');
            $query->whereIn('warehouse_id', $allowedWarehouseIds);
        }

        // Filter by specific warehouse if requested (for switching views)
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        return $query->get();
    }

    public function store(Request $request, DgiService $dgiService, \App\Services\StockService $stockService)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:clients,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'type' => 'required|in:invoice,receipt,proforma',
            'lines' => 'required|array|min:1',
            'lines.*.product_id' => 'required|exists:products,id',
            'lines.*.quantity' => 'required|integer|min:1',
            'lines.*.unit_price' => 'required|numeric|min:0',
            'payment_method' => 'string|nullable' // Add payment method validation
        ]);

        $invoice = DB::transaction(function () use ($validated, $request, $stockService) {

            // Check for Open Work Day
            $workDay = \App\Models\WorkDay::where('status', 'open')->first();
            if (!$workDay) {
                abort(403, 'Aucune journée de travail ouverte. Veuillez ouvrir la caisse.');
            }

            $totalHT = 0;
            foreach ($validated['lines'] as $line) {
                $totalHT += $line['quantity'] * $line['unit_price'];
            }

            // Simple Tax calculation (can be dynamic later)
            $totalTax = 0;
            $totalTTC = $totalHT + $totalTax;

            $invoice = Invoice::create([
                'client_id' => $validated['client_id'] ?? null,
                'user_id' => 1, // Temporarily hardcoded until Auth is fully set
                // 'user_id' => $request->user()->id, 
                'warehouse_id' => $validated['warehouse_id'],
                'work_date' => $workDay->date, // Assign Work Date
                'reference' => 'INV-' . strtoupper(Str::random(8)), // Simple auto-ref
                'type' => $validated['type'],
                'status' => 'validated', // Direct validation for POS
                'total_ht' => $totalHT,
                'total_tax' => $totalTax,
                'total_ttc' => $totalTTC,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'due_date' => now(), // Assume paid/due now
            ]);

            $warehouse = Warehouse::find($validated['warehouse_id']);

            // SKIP STOCK LOGIC FOR PROFORMA
            $isProforma = $validated['type'] === 'proforma';

            foreach ($validated['lines'] as $lineData) {
                $qtyNeeded = $lineData['quantity'];
                $productId = $lineData['product_id'];

                // Check Stock for Auto-Unpack
                $productPivot = $warehouse->products()->where('product_id', $productId)->first();
                $currentStock = $productPivot ? $productPivot->pivot->stock_actuel : 0;

                // SKIP STOCK CHECKS FOR PROFORMA
                if (!$isProforma) {
                    try {
                        $product = Product::find($productId);
                        // Ensure we have enough stock (Auto-unpacking recursive)
                        $stockService->ensureStock($product, $warehouse, $qtyNeeded, Invoice::class, $invoice->id);
                    } catch (\Exception $e) {
                        // Rollback everything if stock fails
                        abort(422, $e->getMessage());
                    }
                }

                // Create Line
                InvoiceLine::create([
                    'invoice_id' => $invoice->id,
                    'product_id' => $productId,
                    'quantity' => $qtyNeeded,
                    'unit_price' => $lineData['unit_price'],
                    'total' => $qtyNeeded * $lineData['unit_price'],
                ]);

                // Update Stock (Sale) - SKIP FOR PROFORMA
                if (!$isProforma) {
                    // Re-fetch pivot to be safe after potential update
                    $productPivot = $warehouse->products()->where('product_id', $productId)->first();

                    if ($productPivot) {
                        $warehouse->products()->updateExistingPivot($productId, [
                            'stock_actuel' => $productPivot->pivot->stock_actuel - $qtyNeeded
                        ]);
                    } else {
                        $warehouse->products()->attach($productId, [
                            'stock_actuel' => -$qtyNeeded,
                            'stock_alerte' => 0
                        ]);
                    }

                    // Log Stock Movement
                    \App\Models\StockMovement::create([
                        'warehouse_id' => $validated['warehouse_id'],
                        'product_id' => $productId,
                        'quantity' => -$qtyNeeded,
                        'type' => 'sale',
                        'reference_type' => Invoice::class,
                        'reference_id' => $invoice->id
                    ]);
                }
            }


            // AUTOMATIC PAYMENT FOR RECEIPTS / IMMEDIATE INVOICES
            // If it's a receipt or paid invoice, ensure we log the payment
            // Note: Proforma is never paid immediately
            if ($validated['type'] !== 'proforma') {
                $paymentMethod = $validated['payment_method'] ?? 'cash';

                // HANDLE CREDIT SALE
                if ($paymentMethod === 'credit') {
                    $invoice->update([
                        'paid_amount' => 0,
                        'payment_status' => 'unpaid',
                        'payment_method' => 'credit'
                    ]);
                }
                // HANDLE IMMEDIATE PAYMENT (Cash, Mobile Money, etc.)
                else {
                    $amountToPay = $totalTTC; // Assuming full payment for POS

                    // create Payment
                    $payment = \App\Models\Payment::create([
                        'invoice_id' => $invoice->id,
                        'client_id' => $validated['client_id'] ?? null,
                        'user_id' => $invoice->user_id,
                        'amount' => $amountToPay,
                        'payment_method' => $paymentMethod,
                        'payment_date' => now(),
                        'reference' => 'PAY-' . $invoice->reference,
                        'notes' => 'Paiement comptoir / POS'
                    ]);

                    // Link to invoice handled by invoice_id above
                    // $payment->invoices()->attach($invoice->id, ['amount' => $amountToPay]);

                    // Update Invoice Status
                    $invoice->update([
                        'paid_amount' => $amountToPay,
                        'payment_status' => 'paid',
                        'payment_method' => $paymentMethod
                    ]);
                }
            }

            return $invoice;
        });

        // Automatic DGI reporting removed as per user request (Manual only)

        return $invoice->load(['lines.product', 'client']);
    }

    public function show(Invoice $invoice)
    {
        return $invoice->load(['lines.product', 'client', 'user', 'warehouse']);
    }

    public function report(Invoice $invoice, DgiService $dgiService)
    {
        if ($invoice->dgi_reference) {
            return response()->json(['message' => 'Cette facture est déjà déclarée.'], 400);
        }

        try {
            $updatedInvoice = $dgiService->reportInvoice($invoice);
            return response()->json([
                'message' => 'Facture déclarée à la DGI avec succès.',
                'invoice' => $updatedInvoice
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la déclaration DGI: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Invoice $invoice)
    {
        if ($invoice->type !== 'proforma') {
            return response()->json(['message' => 'Seules les factures proforma peuvent être supprimées.'], 403);
        }

        return DB::transaction(function () use ($invoice) {
            // Reverse all stock movements linked to this invoice
            $movements = \App\Models\StockMovement::where('reference_type', Invoice::class)
                ->where('reference_id', $invoice->id)
                ->get();

            foreach ($movements as $movement) {
                $warehouse = Warehouse::find($movement->warehouse_id);
                $productPivot = $warehouse->products()->where('product_id', $movement->product_id)->first();

                if ($productPivot) {
                    $warehouse->products()->updateExistingPivot($movement->product_id, [
                        'stock_actuel' => $productPivot->pivot->stock_actuel - $movement->quantity
                    ]);
                }
                // If pivot doesn't exist, it's weird (deleted?), but simply deleting movement cleans logs.

                $movement->delete();
            }

            // Delete lines
            $invoice->lines()->delete();

            // Delete or Update Invoice
            $invoice->delete(); // Soft delete if trait exists, or hard delete.

            return response()->json(['message' => 'Vente annulée et stock restauré avec succès.']);
        });
    }
}
