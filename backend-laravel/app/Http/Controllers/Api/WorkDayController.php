<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WorkDay;
use Carbon\Carbon;

class WorkDayController extends Controller
{
    // Get current open day for specific warehouse
    public function current(Request $request)
    {
        $warehouseId = $request->query('warehouse_id') ?? $request->input('warehouse_id');
        if (!$warehouseId) {
            // Fallback for dev: assume first warehouse of user or global if single-store
            // Ideally we force valid warehouse_id
            return null;
        }
        return WorkDay::where('status', 'open')
            ->where('warehouse_id', $warehouseId)
            ->latest()->first();
    }

    // Check status (compare system date vs open day)
    public function check(Request $request)
    {
        $current = $this->current($request);
        $today = Carbon::today()->format('Y-m-d');

        if (!$current) {
            return response()->json(['status' => 'no_day_open', 'system_date' => $today]);
        }

        if ($current->date !== $today) {
            return response()->json([
                'status' => 'mismatch',
                'work_date' => $current->date,
                'system_date' => $today,
                'work_day' => $current
            ]);
        }

        return response()->json(['status' => 'ok', 'work_day' => $current]);
    }

    // Open a new day
    public function open(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'warehouse_id' => 'required|exists:warehouses,id',
        ]);

        // Ensure no other day is open
        if ($this->current($request)) {
            return response()->json(['message' => 'Une journée est déjà ouverte pour ce magasin.'], 400);
        }

        // Check uniqueness for date+warehouse
        $exists = WorkDay::where('date', $validated['date'])
            ->where('warehouse_id', $validated['warehouse_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Une journée existe déjà pour cette date et ce magasin.'], 422);
        }

        $workDay = WorkDay::create([
            'date' => $validated['date'],
            'warehouse_id' => $validated['warehouse_id'],
            'status' => 'open',
            'opened_by' => $request->user()->id ?? 1,
        ]);

        return response()->json(['message' => 'Journée ouverte avec succès.', 'work_day' => $workDay]);
    }

    // Close the current day
    public function close(Request $request)
    {
        $current = $this->current($request);
        if (!$current) {
            return response()->json(['message' => 'Aucune journée ouverte.'], 400);
        }

        // We can add validation here (e.g., verify cash count matches) purely optional for now
        $current->update([
            'status' => 'closed',
            'closed_by' => $request->user()->id ?? 1,
            'closed_at' => now(),
            // Snapshots logic can be added here if needed
        ]);

        return response()->json(['message' => 'Journée clôturée avec succès.']);
    }
}