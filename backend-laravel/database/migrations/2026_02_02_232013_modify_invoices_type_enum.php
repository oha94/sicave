<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // altering enum in mysql often requires raw statement or doctrine/dbal
            DB::statement("ALTER TABLE invoices MODIFY COLUMN type ENUM('invoice', 'receipt', 'proforma') DEFAULT 'receipt'");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            DB::statement("ALTER TABLE invoices MODIFY COLUMN type ENUM('invoice', 'receipt') DEFAULT 'receipt'");
        });
    }
};
