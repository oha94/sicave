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
        Schema::create('supplier_return_lines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('supplier_return_id')->constrained('supplier_returns')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained();
            $table->decimal('quantity', 10, 3);
            $table->string('reason')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_return_lines');
    }
};
