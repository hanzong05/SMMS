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
       Schema::create('wastes',function(Blueprint $table){
        $table->id();
        $table->string('TypeOfWaste');
        $table->string('Disposition');
        $table->float('Weight');
        $table->string('Unit');
        $table->string('InputBy');
        $table->string('Verifiedby');
       });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
       Schema:: drop('wastes');
    }
};
