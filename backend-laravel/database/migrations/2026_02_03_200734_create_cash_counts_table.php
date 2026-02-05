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
        Schema::create('cash_counts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->date('date'); // Closing Date
            $table->decimal('total_expected', 12, 2)->default(0);
            $table->decimal('total_declared', 12, 2)->default(0);
            $table->decimal('gap', 12, 2)->default(0);
            $table->json('details')->nullable(); // Stores detailed breakdown (Cash, Wave...)
            $table->string('status')->default('pending'); // pending, validated
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cash_counts');
    }
};
