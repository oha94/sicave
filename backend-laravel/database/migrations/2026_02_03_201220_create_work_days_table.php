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
        Schema::create('work_days', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique(); // The logical work date
            $table->string('status')->default('open'); // open, closed
            $table->foreignId('opened_by')->constrained('users');
            $table->foreignId('closed_by')->nullable()->constrained('users');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();

            // Closing summary snapshots
            $table->decimal('final_cash_expected', 12, 2)->nullable();
            $table->decimal('final_cash_declared', 12, 2)->nullable();
            $table->decimal('final_cash_gap', 12, 2)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('work_days');
    }
};
