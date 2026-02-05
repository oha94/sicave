<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['client', 'user', 'invoices'])
            ->orderBy('payment_date', 'desc')
            ->orderBy('created_at', 'desc');

        // Filter by client if provided
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        // Filter by date range
        if ($request->has('date_from')) {
            $query->where('payment_date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->where('payment_date', '<=', $request->date_to);
        }

        // Filter by payment method
        if ($request->has('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        $payments = $query->paginate(50);

        return response()->json($payments);
    }

    public function getDebtors(Request $request)
    {
        $status = $request->input('status'); // unpaid, partial, paid, or null (all debt)

        $statuses = $status ? [$status] : ['unpaid', 'partial'];

        // Get clients with invoices matching status
        $clients = \App\Models\Client::whereHas('invoices', function ($q) use ($statuses) {
            $q->whereIn('payment_status', $statuses);
        })->with([
                    'invoices' => function ($q) use ($statuses) {
                        $q->whereIn('payment_status', $statuses);
                    }
                ])->get();

        // Calculate total debt (or total value for that status)
        $clients->transform(function ($client) {
            $client->total_debt = $client->invoices->sum(function ($inv) {
                // If checking 'paid', maybe we want total_paid amount?
                // For now user just wants the list. Let's show remaining debt for consistency in "Debt" context,
                // or show total_amount if 'paid'.
                return $inv->total_ttc - $inv->paid_amount;
            });
            // If tab is 'paid', total_debt will be 0 usually. We might want 'total_paid' sum?
            if (request('status') === 'paid') {
                $client->total_paid_history = $client->invoices->sum('paid_amount');
            }

            unset($client->invoices);
            return $client;
        });

        return $clients->values();
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'invoices' => 'array', // Optional list of specific invoices to pay
            'invoices.*.id' => 'exists:invoices,id',
            'invoices.*.amount' => 'numeric|min:0.01'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated = $validator->validated();
        $clientId = $validated['client_id'];
        $amount = $validated['amount'];

        DB::transaction(function () use ($validated, $clientId, $amount) {
            // Check for Open Work Day
            $workDay = \App\Models\WorkDay::where('status', 'open')->first();
            if (!$workDay) {
                abort(403, 'Aucune journée de travail ouverte. Veuillez ouvrir la caisse.');
            }

            // 1. Create Payment Record
            $payment = Payment::create([
                'client_id' => $clientId,
                'user_id' => auth()->id() ?? \App\Models\User::first()->id,
                'work_date' => $workDay->date,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'reference' => $validated['reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'payment_date' => $validated['payment_date']
            ]);

            $remainingPayment = $amount;
            $invoicesToProcess = [];

            // 2. Determine Allocation Strategy
            // Option A: Specific allocation by user
            if (isset($validated['invoices']) && !empty($validated['invoices'])) {
                foreach ($validated['invoices'] as $inv) {
                    $invoicesToProcess[] = [
                        'invoice' => Invoice::find($inv['id']),
                        'amount' => $inv['amount']
                    ];
                }
            }
            // Option B: Auto-allocation (FIFO) to unpaid invoices
            else {
                // Get all unpaid or partial invoices for client, ordered by oldest due date
                $unpaidInvoices = Invoice::where('client_id', $clientId)
                    ->whereIn('payment_status', ['unpaid', 'partial'])
                    ->orderBy('due_date', 'asc') // FIFO
                    ->orderBy('created_at', 'asc')
                    ->get();

                foreach ($unpaidInvoices as $invoice) {
                    if ($remainingPayment <= 0)
                        break;

                    $debt = $invoice->total_ttc - $invoice->paid_amount;
                    $toPay = min($debt, $remainingPayment);

                    $invoicesToProcess[] = [
                        'invoice' => $invoice,
                        'amount' => $toPay
                    ];

                    $remainingPayment -= $toPay;
                }
            }

            // 3. Process Allocations
            foreach ($invoicesToProcess as $item) {
                $invoice = $item['invoice'];
                $allocatedAmount = $item['amount'];

                // Update Invoice
                $invoice->paid_amount += $allocatedAmount;
                if ($invoice->paid_amount >= $invoice->total_ttc - 0.01) { // Tolerance for float
                    $invoice->payment_status = 'paid';
                    $invoice->paid_amount = $invoice->total_ttc; // Cap it
                } else {
                    $invoice->payment_status = 'partial';
                }
                $invoice->save();

                // Attach to Payment
                $payment->invoices()->attach($invoice->id, ['amount' => $allocatedAmount]);
            }
        });

        return response()->json(['message' => 'Paiement enregistré avec succès.']);
    }

    public function getClientDebt($clientId)
    {
        // Return ALL invoices for the tabs (Unpaid, Partial, Paid)
        $invoices = Invoice::where('client_id', $clientId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($inv) {
                $inv->remaining_amount = $inv->total_ttc - $inv->paid_amount;
                return $inv;
            });

        // Calculate Only Real Debt
        $totalDebt = $invoices->whereIn('payment_status', ['unpaid', 'partial'])->sum('remaining_amount');

        return response()->json([
            'total_debt' => $totalDebt,
            'invoices' => $invoices
        ]);
    }
}
