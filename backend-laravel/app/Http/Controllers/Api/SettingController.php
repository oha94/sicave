<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Setting;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

use App\Models\OtpCode;
use Carbon\Carbon;

class SettingController extends Controller
{
    public function generateOtp(Request $request)
    {
        $user = Auth::user();

        // Invalidate old codes
        OtpCode::where('user_id', $user->id)->delete();

        $code = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);

        OtpCode::create([
            'user_id' => $user->id,
            'code' => $code,
            'expires_at' => Carbon::now()->addMinute()
        ]);

        // Simulate Email Sending by logging
        Log::info("OTP GENERATED FOR USER {$user->email}: {$code}");

        // Ideally: Mail::to($user->email)->send(new OtpMail($code));

        return response()->json(['success' => true, 'message' => 'Code envoyé avec succès par email.']);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate(['code' => 'required|string|size:6']);
        $user = Auth::user();

        $validOtp = OtpCode::where('user_id', $user->id)
            ->where('code', $request->code)
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if ($validOtp) {
            $validOtp->delete(); // Consume OTP
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Code invalide ou expiré.'], 403);
    }

    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key');
        return response()->json($settings);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Paramètres mis à jour avec succès', 'settings' => Setting::all()->pluck('value', 'key')]);
    }

    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            $path = $request->file('logo')->store('logos', 'public');

            // Update setting
            Setting::updateOrCreate(
                ['key' => 'company_logo'],
                ['value' => '/storage/' . $path]
            );

            return response()->json([
                'message' => 'Logo mis à jour',
                'url' => '/storage/' . $path
            ]);
        }

        return response()->json(['message' => 'Aucun fichier reçu'], 400);
    }
}
