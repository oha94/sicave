<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\CashCount;
use App\Models\Payment;
use App\Models\Expense;
use Carbon\Carbon;

class CashCountController extends Controller
{
    public function index()
    {
        return CashCount::with('user')->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'total_declared' => 'required|numeric|min:0',
            'details' => 'required|array', // { "Espèces": 5000, "Wave": 2000 }
            'notes' => 'nullable|string'
        ]);

        $user = $request->user();
        if (!$user)
            $user = \App\Models\User::first(); // Fallback for dev

        $date = $validated['date'];
        $startOfDay = Carbon::parse($date)->startOfDay();
        $endOfDay = Carbon::parse($date)->endOfDay();

        // 1. Calculate Expected Inflows (Payments)
        $payments = Payment::where('user_id', $user->id)
            ->whereBetween('payment_date', [$startOfDay, $endOfDay])
            ->get();

        // 2. Calculate Expected Outflows (Expenses)
        $expenses = Expense::where('user_id', $user->id)
            ->whereBetween('date', [$startOfDay, $endOfDay])
            ->get();

        // 3. Aggregate by Method
        $expected = [
            'Espèces' => 0,
            'Mobile Money' => 0,
            'Chèque' => 0,
            'Virement' => 0,
            'CB' => 0,
            'Autre' => 0
        ];

        // Process Payments
        foreach ($payments as $p) {
            $method = $this->normalizeMethod($p->payment_method);
            if (isset($expected[$method])) {
                $expected[$method] += $p->amount;
            } else {
                $expected['Autre'] += $p->amount;
            }
        }

        // Process Expenses (Subtract)
        foreach ($expenses as $e) {
            $method = $this->normalizeMethod($e->type);
            if (isset($expected[$method])) {
                $expected[$method] -= $e->amount;
            }
        }

        $totalExpected = array_sum($expected);
        $totalDeclared = $validated['total_declared'];
        $gap = $totalDeclared - $totalExpected;

        // Check for Open Work Day
        $workDay = \App\Models\WorkDay::where('status', 'open')->first();
        if (!$workDay) {
            return response()->json(['message' => 'Aucune journée de travail ouverte.'], 403);
        }

        $cashCount = CashCount::create([
            'user_id' => $user->id,
            'date' => $date,
            'work_date' => $workDay->date,
            'total_expected' => $totalExpected,
            'total_declared' => $totalDeclared,
            'gap' => $gap,
            'details' => json_encode([
                'declared' => $validated['details'],
                'expected' => $expected
            ]),
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null
        ]);

        return response()->json([
            'message' => 'Versement enregistré avec succès.',
            'data' => $cashCount
        ]);
    }

    private function normalizeMethod($method)
    {
        $m = strtolower($method);
        if (str_contains($m, 'esp') || str_contains($m, 'cash'))
            return 'Espèces';
        if (
            str_contains($m, 'mobile') || str_contains($m, 'wave') || str_contains($m, 'orange') || str_contains($m, 'mtn') ||
            str_contains($m, 'moov')
        )
            return 'Mobile Money';
        if (str_contains($m, 'cheque') || str_contains($m, 'chèque'))
            return 'Chèque';
        if (str_contains($m, 'vire') || str_contains($m, 'bank'))
            return 'Virement';
        if (str_contains($m, 'carte') || str_contains($m, 'cb') || str_contains($m, 'card'))
            return 'CB';
        return 'Autre';
    }
}