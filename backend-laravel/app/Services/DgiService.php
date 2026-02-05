<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DgiService
{
    protected $baseUrl;
    protected $login;
    protected $password;
    protected $token;

    public function __construct()
    {
        // Load settings from database
        $settings = Setting::all()->pluck('value', 'key');

        $this->baseUrl = $settings['dgi_base_url'] ?? env('DGI_API_URL', 'https://www.services.fne.dgi.gouv.ci/ws');
        $this->login = $settings['dgi_login'] ?? env('DGI_LOGIN');
        $this->password = $settings['dgi_password'] ?? env('DGI_PASSWORD');

        // Check if we have a cached token
        $this->token = Cache::get('dgi_auth_token');
    }

    /**
     * Authenticate with DGI API and get Bearer token
     */
    public function authenticate()
    {
        if (!$this->login || !$this->password) {
            throw new \Exception("DGI credentials not configured. Please configure in Settings.");
        }

        try {
            Log::info("DGI Authentication attempt for user: {$this->login}");

            $response = Http::acceptJson()
                ->post("{$this->baseUrl}/auth/login", [
                    'login' => $this->login,
                    'password' => $this->password,
                ]);

            Log::info("DGI Auth Response Status: " . $response->status());
            Log::info("DGI Auth Response Body: " . $response->body());

            if ($response->successful()) {
                $data = $response->json();
                $token = $data['token'] ?? null;

                if (!$token) {
                    throw new \Exception("No token received from DGI API");
                }

                // Cache token for 23 hours (assuming 24h validity with 1h margin)
                Cache::put('dgi_auth_token', $token, now()->addHours(23));
                $this->token = $token;

                Log::info("DGI Authentication successful. Token cached.");
                return $token;
            } else {
                $errorMessage = $response->json()['message'] ?? $response->body();
                Log::error("DGI Authentication failed: " . $errorMessage);
                throw new \Exception("DGI Authentication failed: " . $errorMessage);
            }

        } catch (\Exception $e) {
            Log::error("DGI Authentication Exception: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get valid token (authenticate if needed)
     */
    protected function getToken()
    {
        if (!$this->token) {
            $this->authenticate();
        }
        return $this->token;
    }

    /**
     * Test DGI connection
     */
    public function testConnection()
    {
        try {
            $token = $this->authenticate();
            return [
                'success' => true,
                'message' => 'Connexion réussie à l\'API DGI',
                'token_preview' => substr($token, 0, 20) . '...',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Report invoice to DGI
     */
    public function reportInvoice(Invoice $invoice)
    {
        // Check if credentials are configured
        if (!$this->login || !$this->password) {
            Log::warning("DGI Service: No credentials provided. Simulating success.");
            return $this->simulateSuccess($invoice);
        }

        try {
            // Get valid token
            $token = $this->getToken();

            $payload = $this->mapInvoiceToPayload($invoice);

            Log::info("DGI Payload for Invoice {$invoice->id}: ", $payload);

            $response = Http::withToken($token)
                ->acceptJson()
                ->timeout(30)
                ->post("{$this->baseUrl}/external/invoices/sign", $payload);

            Log::info("DGI Response Status: " . $response->status());
            Log::info("DGI Response Body: " . $response->body());

            // Handle 401 - Token expired, retry once
            if ($response->status() === 401) {
                Log::warning("DGI Token expired, re-authenticating...");
                Cache::forget('dgi_auth_token');
                $token = $this->authenticate();

                // Retry request with new token
                $response = Http::withToken($token)
                    ->acceptJson()
                    ->timeout(30)
                    ->post("{$this->baseUrl}/external/invoices/sign", $payload);

                Log::info("DGI Retry Response Status: " . $response->status());
                Log::info("DGI Retry Response Body: " . $response->body());
            }

            if ($response->successful()) {
                $data = $response->json();

                // Update Invoice with DGI data
                $invoice->update([
                    'dgi_reference' => $data['reference'] ?? null,
                    'dgi_token' => $data['invoice']['token'] ?? $data['token'] ?? null,
                    'dgi_qr_url' => $data['qrCodeUrl'] ?? $data['qr_url'] ?? null,
                    'dgi_synced_at' => now(),
                ]);

                Log::info("Invoice {$invoice->id} successfully synced with DGI. Reference: {$invoice->dgi_reference}");
                return $invoice;
            } else {
                $errorData = $response->json();
                $errorMessage = $errorData['message'] ?? $errorData['error'] ?? $response->body();

                Log::error("DGI Error for Invoice {$invoice->id}: " . $errorMessage);
                throw new \Exception("Erreur DGI: " . $errorMessage);
            }

        } catch (\Exception $e) {
            Log::error("DGI Exception for Invoice {$invoice->id}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Map invoice data to DGI payload format
     */
    protected function mapInvoiceToPayload(Invoice $invoice)
    {
        $client = $invoice->client;
        $settings = Setting::all()->pluck('value', 'key');

        // Items mapping
        $items = $invoice->lines->map(function ($line) {
            return [
                'reference' => $line->product->sku ?? ('PROD-' . $line->product_id),
                'description' => $line->product->designation,
                'quantity' => (int) $line->quantity,
                'amount' => (int) $line->unit_price,
                'discount' => 0,
                'measurementUnit' => 'unit',
                'taxes' => ['TVAC'], // TODO: Make this dynamic based on product
            ];
        })->toArray();

        // Map payment method to DGI format
        $paymentMethodMap = [
            'cash' => 'cash',
            'especes' => 'cash',
            'mobile_money' => 'mobile',
            'orange_money' => 'mobile',
            'mtn_money' => 'mobile',
            'moov_money' => 'mobile',
            'wave' => 'mobile',
            'carte_bancaire' => 'card',
            'card' => 'card',
            'cheque' => 'check',
            'credit' => 'credit',
            'virement' => 'transfer',
        ];

        $paymentMethod = $paymentMethodMap[strtolower($invoice->payment_method ?? 'cash')] ?? 'cash';

        $payload = [
            "invoiceType" => "sale",
            "paymentMethod" => $paymentMethod,
            "template" => ($client && $client->ncc) ? "B2B" : "B2C",
            "clientNcc" => $client && $client->ncc ? $client->ncc : null,
            "clientCompanyName" => $client ? $client->nom : "Client Comptoir",
            "clientPhone" => $client ? $client->telephone : "00000000",
            "clientEmail" => $client ? $client->email : "",
            "clientSellerName" => $invoice->user->name ?? "Admin",
            "pointOfSale" => $settings['dgi_point_of_sale'] ?? "POS-01",
            "establishment" => $settings['company_name'] ?? "SICAVE",
            "commercialMessage" => $settings['dgi_commercial_message'] ?? "Merci de votre visite",
            "footer" => "Logiciel: SICAVE",
            "items" => $items,
            "isRne" => false,
            "foreignCurrency" => "",
            "foreignCurrencyRate" => 0,
            "discount" => 0
        ];

        return $payload;
    }

    /**
     * Simulate success for testing without credentials
     */
    protected function simulateSuccess(Invoice $invoice)
    {
        $ref = "SIM-" . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(10));
        $uuid = (string) \Illuminate\Support\Str::uuid();

        $invoice->update([
            'dgi_reference' => $ref,
            'dgi_token' => $uuid,
            'dgi_qr_url' => "https://www.services.fne.dgi.gouv.ci/verification/" . $uuid,
            'dgi_synced_at' => now(),
        ]);

        Log::info("DGI Simulation: Invoice {$invoice->id} marked as synced (SIMULATION MODE)");
        return $invoice;
    }
}
