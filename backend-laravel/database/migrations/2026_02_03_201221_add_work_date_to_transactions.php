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
        $tables = ['invoices', 'payments', 'expenses', 'cash_counts'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                // We default to current date for existing records to avoid issues, 
                // but in practice logic should enforce work_date presence.
                $table->date('work_date')->nullable()->after('created_at');
                $table->index('work_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['invoices', 'payments', 'expenses', 'cash_counts'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropColumn('work_date');
            });
        }
    }
};
