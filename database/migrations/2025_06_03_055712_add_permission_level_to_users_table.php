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
        Schema::table('users', function (Blueprint $table) {
            // Add permission_level column with enum values
            $table->enum('permission_level', ['view', 'edit'])->default('view')->after('role');
            
            // Add status column if it doesn't exist
            if (!Schema::hasColumn('users', 'status')) {
                $table->enum('status', ['active', 'inactive'])->default('active')->after('permission_level');
            }
            
            // Add department column if it doesn't exist
            if (!Schema::hasColumn('users', 'department')) {
                $table->string('department')->nullable()->after('role');
            }
            
            // Add last_login_at column if it doesn't exist
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop the columns we added
            $table->dropColumn([
                'permission_level',
                'status',
                'department',
                'last_login_at'
            ]);
        });
    }
};