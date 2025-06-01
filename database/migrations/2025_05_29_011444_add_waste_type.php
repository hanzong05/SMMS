<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
         Schema::create('WasteTypes',function(Blueprint $table){
        $table->id();
        $table->string('WasteType');
        $table->string('Svg');
       });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema:: drop('WasteTypes');
    }
};
