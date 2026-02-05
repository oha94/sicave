<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DgiService
{
    protected $baseUrl;
    protected $apiKey;

    public function __construct()
    {
        $this->baseUrl = env('DGI_API_URL', 'http://54.247.95.108/ws');
        // Warning: Bearer token usually comes from an Auth endpoint or is static.
        // Doc says "Authorization: Bearer <API_KEY>" where API_KEY is from dashboard.
        $this->apiKey = env('DGI_API_KEY');
    }

    public function reportInvoice(Invoice $invoice)
    {
        if (!$this->apiKey) {
            // Fallback for Development/Testing without creds
            Log::warning("DGI Service: No API Key provided. Simulating success.");
            return $this->simulateSuccess($invoice);
        }

        $payload = $this->mapInvoiceToPayload($invoice);

        Log::info("DGI Payload for Invoice {$invoice->id}: ", $payload);

        try {
            $response = Http::withToken($this->apiKey)
                ->acceptJson()
                ->post("{$this->baseUrl}/external/invoices/sign", $payload);

            Log::info("DGI Response Status: " . $response->status());
            Log::info("DGI Response Body: " . $response->body());

            if ($response->successful()) {
                $data = $response->json();

                // Update Invoice
                $invoice->update([
                    'dgi_reference' => $data['reference'] ?? null,
                    'dgi_token' => $data['invoice']['token'] ?? null,
                    'dgi_qr_url' => $data['token'] ?? null,
                    'dgi_synced_at' => now(),
                ]);

                return $invoice;
            } else {
                Log::error("DGI Error: " . $response->body());
                throw new \Exception("DGI API Error: " . $response->status() . " " . $response->body());
            }

        } catch (\Exception $e) {
            Log::error("DGI Exception: " . $e->getMessage());
            throw $e;
        }
    }

    protected function mapInvoiceToPayload(Invoice $invoice)
    {
        $client = $invoice->client;

        // Items mapping
        $items = $invoice->lines->map(function ($line) {
            return [
                'reference' => $line->product->sku ?? ('PROD-' . $line->product_id),
                'description' => $line->product->designation,
                'quantity' => (int) $line->quantity,
                'amount' => (int) $line->unit_price,
                'discount' => 0, // Not yet implemented
                'measurementUnit' => 'unit', // Pending improvement
                'taxes' => ['TVAC'], // Defaulting to exempt for now
            ];
        })->toArray();

        $payload = [
            "invoiceType" => "sale",
            "paymentMethod" => $invoice->payment_method ?? 'cash',
            "template" => "B2C", // Default, change if client has NCC
            "clientNcc" => $client && $client->ncc ? $client->ncc : null,
            "clientCompanyName" => $client ? $client->nom : "Client Comptoir",
            "clientPhone" => $client ? $client->telephone : "00000000",
            "clientEmail" => $client ? $client->email : "",
            "clientSellerName" => "Admin", // Should be user name
            "pointOfSale" => "POS-01", // Should be from .env or config
            "establishment" => "SICAVE", // Should be from config
            "commercialMessage" => "Merci de votre visite",
            "footer" => "Logiciel: CaissePro",
            "items" => $items,
            "isRne" => false,
            "foreignCurrency" => "",
            "foreignCurrencyRate" => 0,
            "discount" => 0
        ];

        return $payload;
    }

    protected function simulateSuccess(Invoice $invoice)
    {
        // Generate Fake Data
        $ref = "SIM-" . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(10));
        $uuid = (string) \Illuminate\Support\Str::uuid();
        $invoice->update([
            'dgi_reference' => $ref,
            'dgi_token' => $uuid,
            'dgi_qr_url' => "http://54.247.95.108/fr/verification/" . $uuid,
            'dgi_synced_at' => now(),
        ]);
        return $invoice;
    }
}
