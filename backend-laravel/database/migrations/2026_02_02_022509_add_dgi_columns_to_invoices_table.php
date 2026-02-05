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
        Schema::table('invoices', function (Blueprint $table) {
            $table->string('dgi_reference')->nullable();
            $table->string('dgi_token')->nullable(); // For QR Code generation
            $table->string('dgi_qr_url')->nullable(); // Computed URL
            $table->timestamp('dgi_synced_at')->nullable();
            $table->string('payment_method')->default('cash'); // 'cash', 'mobile-money', etc.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            //
        });
    }
};
