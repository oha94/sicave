<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Expense;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::query()->with('user');

        if ($request->has('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->has('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        return response()->json($query->latest('date')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'type' => 'required|string',
            'authorizer' => 'required|string',
            'reason' => 'required|string',
            'date' => 'required|date',
        ]);

        // Check for Open Work Day
        $workDay = \App\Models\WorkDay::where('status', 'open')->first();
        if (!$workDay) {
            return response()->json(['message' => 'Aucune journée de travail ouverte.'], 403);
        }

        $expense = Expense::create([
            ...$validated,
            'user_id' => $request->user()?->id,
            'work_date' => $workDay->date
        ]);

        return response()->json($expense, 201);
    }

    public function destroy($id)
    {
        $expense = Expense::findOrFail($id);
        $expense->delete();
        return response()->json(null, 204);
    }
}
