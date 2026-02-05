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
        // 1. Add warehouse_id column (nullable first to allow adding data, but we will constrain it)
        Schema::table('work_days', function (Blueprint $table) {
            $table->foreignUuid('warehouse_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        // 2. Clear existing data (since it's dev/broken state usually) or assign defaults?
        // For safety in dev, we truncate if needed, or we just drop the index.
        // Assuming Dev mode:
        // DB::table('work_days')->truncate(); // Safer to just proceed if empty.

        // 3. Drop existing unique index on 'date'
        Schema::table('work_days', function (Blueprint $table) {
            $table->dropUnique(['date']);
        });

        // 4. Add new unique index [date, warehouse_id]
        Schema::table('work_days', function (Blueprint $table) {
            $table->unique(['date', 'warehouse_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('work_days', function (Blueprint $table) {
            $table->dropForeign(['warehouse_id']);
            $table->dropUnique(['date', 'warehouse_id']);
            $table->dropColumn('warehouse_id');
            $table->unique(['date']);
        });
    }
};
