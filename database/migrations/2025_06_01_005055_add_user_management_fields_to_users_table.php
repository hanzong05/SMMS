<?php
// In the migration file
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->after('email');
            $table->string('department')->nullable()->after('role');
            $table->string('status')->default('active')->after('department');
            $table->timestamp('last_login_at')->nullable()->after('status');
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'department', 'status', 'last_login_at']);
        });
    }
};