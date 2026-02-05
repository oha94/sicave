<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'pseudo' => 'required',
            'password' => 'required',
        ]);

        \Illuminate\Support\Facades\Log::info('Login Request Data:', $request->all());




        // Case insensitive lookup for Pseudo OR Email
        $loginInput = strtolower($credentials['pseudo']);
        $user = \App\Models\User::whereRaw('LOWER(pseudo) = ?', [$loginInput])
            ->orWhereRaw('LOWER(email) = ?', [$loginInput])
            ->first();

        \Illuminate\Support\Facades\Log::info('User lookup result:', ['found' => (bool) $user, 'pseudo' => $credentials['pseudo']]);

        if ($user) {
            $check = \Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password);
            \Illuminate\Support\Facades\Log::info('Hash check result:', ['match' => $check]);
        }

        if ($user && \Illuminate\Support\Facades\Hash::check($credentials['password'], $user->password)) {
            /** @var \App\Models\User $user */
            $user->load('warehouses'); // Load allowed warehouses
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token
            ]);
        }

        return response()->json(['message' => 'Identifiants (Pseudo) incorrects'], 401);
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }
}
