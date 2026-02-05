<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a Warehouse
        $warehouse = \App\Models\Warehouse::firstOrCreate(
            ['nom' => 'Cave Principale'],
            ['adresse' => 'Abidjan, Cocody', 'type' => 'warehouse']
        );

        // Create Categories
        $catVin = \App\Models\Category::firstOrCreate(['nom' => 'Vins Rouges']);
        $catChamp = \App\Models\Category::firstOrCreate(['nom' => 'Champagnes']);

        // Create Products
        $products = [
            [
                'designation' => 'Château Margaux 2015',
                'category_id' => $catVin->id,
                'selling_price' => 150000,
                'cost_price' => 120000,
                'stock' => 50
            ],
            [
                'designation' => 'Moët & Chandon Impérial',
                'category_id' => $catChamp->id,
                'selling_price' => 45000,
                'cost_price' => 35000,
                'stock' => 120
            ],
            [
                'designation' => 'Dom Pérignon 2012',
                'category_id' => $catChamp->id,
                'selling_price' => 180000,
                'cost_price' => 140000,
                'stock' => 10
            ]
        ];

        foreach ($products as $pData) {
            $stockQty = $pData['stock'];
            unset($pData['stock']);

            // Map content
            $pData['buying_price'] = $pData['cost_price'];
            unset($pData['cost_price']);
            $pData['sku'] = strtoupper(substr(\Illuminate\Support\Str::slug($pData['designation']), 0, 3)) . rand(1000, 9999);

            $product = \App\Models\Product::create($pData);

            // Add Stock via Relationship
            $product->warehouses()->attach($warehouse->id, [
                'stock_actuel' => $stockQty,
                'stock_alerte' => 5
            ]);
        }

        // --- DGI Invoice Simulation ---
        $clientCorp = \App\Models\Client::create([
            'nom' => 'HOTEL IVOIRE',
            'type' => 'entreprise',
            'ncc' => '0011223344',
            'rccm' => 'CI-ABJ-2020-B-12345',
            'adresse' => 'Cocody, Abidjan',
            'telephone' => '27 22 48 26 26'
        ]);

        $invoice = \App\Models\Invoice::create([
            'warehouse_id' => $warehouse->id,
            'user_id' => \App\Models\User::first()->id ?? 1, // Ensure user exists
            'client_id' => $clientCorp->id,
            'reference' => 'FAC-2026-0001',
            'type' => 'invoice',
            'status' => 'paid',
            'payment_method' => 'check',
            'total_ht' => 450000,
            'total_tax' => 81000, // 18%
            'total_ttc' => 531000,
            'dgi_reference' => 'DGI-SIG-2026-XYZ-12345',
            'dgi_token' => 'PREV-TOKEN-XYZ',
            'dgi_synced_at' => now(),
            'dgi_qr_url' => 'Simulated QR Code Data'
        ]);

        // Lines
        // 3x Margaux
        \App\Models\InvoiceLine::create([
            'invoice_id' => $invoice->id,
            'product_id' => $products[0]['id'] ?? \App\Models\Product::where('designation', 'Château Margaux 2015')->first()->id,
            'quantity' => 3,
            'unit_price' => 150000,
            'total' => 450000
        ]);
    }
}
