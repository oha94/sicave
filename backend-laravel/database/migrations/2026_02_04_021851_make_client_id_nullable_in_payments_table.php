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
        Schema::table('payments', function (Blueprint $table) {
            // Using raw statement to handle modification safely
            // Using change() requires dbal, so we might try raw sql if needed.
            // But let's try standard Laravel way first, if fail, we fallback.
            // Actually, to avoid dbal dependency issues in this env:
            // DB::statement('ALTER TABLE payments MODIFY client_id CHAR(36) NULL');
            // UUIDs are char(36).
            // But let's stick to standard first.
        });
        DB::statement('ALTER TABLE payments MODIFY client_id CHAR(36) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // DB::statement('ALTER TABLE payments MODIFY client_id CHAR(36) NOT NULL');
    }
};
