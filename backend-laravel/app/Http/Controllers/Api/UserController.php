<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    public function index()
    {
        return User::with('warehouses')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'pseudo' => ['required', 'string', 'max:255', 'unique:users'],
            'role' => ['required', 'string', 'in:admin,manager,user'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'warehouses' => ['nullable', 'array'],
            'warehouses.*' => ['exists:warehouses,id']
        ]);

        $user = User::create([
            'name' => $request->name,
            'pseudo' => $request->pseudo,
            'role' => $request->role,
            'email' => $request->email, // Can be null
            'password' => Hash::make($request->password),
        ]);

        if ($request->has('warehouses')) {
            $user->warehouses()->sync($request->warehouses);
        }

        return $user->load('warehouses');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['string', 'max:255'],
            'pseudo' => ['string', 'max:255', 'unique:users,pseudo,' . $user->id],
            'role' => ['string', 'in:admin,manager,user'],
            'email' => ['nullable', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'warehouses' => ['nullable', 'array'],
            'warehouses.*' => ['exists:warehouses,id']
        ]);

        $user->update($request->only('name', 'pseudo', 'role', 'email'));

        if ($request->has('warehouses')) {
            $user->warehouses()->sync($request->warehouses);
        }

        return $user->load('warehouses');
    }

    public function destroy(User $user)
    {
        $user->delete();
        return response()->noContent();
    }
}
