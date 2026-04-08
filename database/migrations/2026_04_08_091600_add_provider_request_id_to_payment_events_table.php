<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_events', function (Blueprint $table): void {
            $table->string('provider_request_id')->nullable();
            $table->unique(
                ['payment_id', 'source', 'provider_request_id'],
                'payment_events_payment_source_provider_request_id_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::table('payment_events', function (Blueprint $table): void {
            $table->dropUnique('payment_events_payment_source_provider_request_id_unique');
            $table->dropColumn('provider_request_id');
        });
    }
};
