<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'gender')) {
            return;
        }

        DB::table('users')->where('gender', 'homme')->update(['gender' => 'male']);
        DB::table('users')->where('gender', 'femme')->update(['gender' => 'female']);
        DB::table('users')->where('gender', 'autre')->update(['gender' => 'other']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY gender ENUM('male','female','other') NULL");
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'gender')) {
            return;
        }

        DB::table('users')->where('gender', 'male')->update(['gender' => 'homme']);
        DB::table('users')->where('gender', 'female')->update(['gender' => 'femme']);
        DB::table('users')->where('gender', 'other')->update(['gender' => 'autre']);

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY gender ENUM('homme','femme','autre') NULL");
        }
    }
};

