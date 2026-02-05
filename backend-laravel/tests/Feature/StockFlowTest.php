<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Warehouse;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Category;

class StockFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_stock_cycle()
    {
        // 1. Setup Data
        $category = Category::create(['nom' => 'Vins Rouges']);
        $product = Product::create([
            'designation' => 'Château Margaux',
            'sku' => 'VIN-001',
            'pmp' => 100.00,
            'category_id' => $category->id
        ]);
        $warehouse = Warehouse::create(['nom' => 'Entrepôt Principal', 'type' => 'stock']);
        $supplier = Supplier::create(['nom' => 'Grand Vignoble']);

        // 2. Create Reception (Draft)
        $response = $this->postJson('/api/stock/receptions', [
            'supplier_id' => $supplier->id,
            'warehouse_id' => $warehouse->id,
            'lines' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10,
                    'unit_price' => 120.00 // Pchera que PMP (100)
                ]
            ]
        ]);

        $response->assertStatus(201);
        $receptionId = $response->json('id');

        // 3. Validate Reception
        $this->postJson("/api/stock/receptions/{$receptionId}/validate")
            ->assertStatus(200);

        // Verify Stock increased
        $this->assertDatabaseHas('warehouse_product', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'stock_actuel' => 10
        ]);

        // Verify PMP updated
        // Initial PMP 100. Stock 0.
        // Incoming: 10 * 120.
        // New PMP = (0*100 + 10*120) / 10 = 120.
        $this->assertEquals(120.00, $product->refresh()->pmp);

        // 4. Create Inventory (Draft)
        $invResponse = $this->postJson('/api/inventory', [
            'warehouse_id' => $warehouse->id,
            'type' => 'partial'
        ]);
        $inventoryId = $invResponse->json('id');

        // 5. Add/Update Lines (Resultat Inventaire: on en trouve 8 au lieu de 10)
        $this->putJson("/api/inventory/{$inventoryId}", [
            'lines' => [
                [
                    'product_id' => $product->id,
                    'stock_theoretical' => 10,
                    'stock_real' => 8
                ]
            ]
        ])->assertStatus(200);

        // 6. Validate Inventory
        $this->postJson("/api/inventory/{$inventoryId}/validate")
            ->assertStatus(200);

        // Verify Stock adjusted
        $this->assertDatabaseHas('warehouse_product', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'stock_actuel' => 8
        ]);

        // Verify Movement Created for gap (-2)
        $this->assertDatabaseHas('stock_movements', [
            'warehouse_id' => $warehouse->id,
            'product_id' => $product->id,
            'quantity' => -2,
            'type' => 'ADJUST',
            'reference_type' => 'App\Models\Inventory',
            'reference_id' => $inventoryId
        ]);
    }
}
