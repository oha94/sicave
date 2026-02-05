<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Client;

class ClientController extends Controller
{
    public function index()
    {
        return Client::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string',
            'email' => 'nullable|email',
            'telephone' => 'nullable|string',
            'adresse' => 'nullable|string',
            'type' => 'nullable|string',
            'ncc' => 'nullable|string',
            'rccm' => 'nullable|string',
            'status' => 'nullable|in:active,suspended'
        ]);

        return Client::create($validated);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'nom' => 'string',
            'email' => 'nullable|email',
            'telephone' => 'nullable|string',
            'adresse' => 'nullable|string',
            'type' => 'nullable|string',
            'ncc' => 'nullable|string',
            'rccm' => 'nullable|string',
            'status' => 'nullable|in:active,suspended'
        ]);

        $client->update($validated);
        return $client;
    }

    public function toggleStatus(Client $client)
    {
        $newStatus = $client->status === 'active' ? 'suspended' : 'active';
        $client->update(['status' => $newStatus]);
        return $client;
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->noContent();
    }
}
