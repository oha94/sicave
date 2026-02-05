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
        Schema::table('products', function (Blueprint $table) {
            $table->softDeletes();
            $table->foreignUuid('merged_into_id')->nullable()->constrained('products')->nullOnDelete();
            $table->timestamp('merged_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropForeign(['merged_into_id']);
            $table->dropColumn(['merged_into_id', 'merged_at']);
        });
    }
};
