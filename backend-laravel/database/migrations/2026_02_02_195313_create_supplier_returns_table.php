<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('supplier_returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_reception_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('warehouse_id')->constrained();
            $table->foreignUuid('supplier_id')->constrained();
            $table->string('reference')->unique();
            $table->string('status')->default('pending'); // pending, completed
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->text('comments')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_returns');
    }
};
