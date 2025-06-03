<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run()
    {
        $permissions = [
            ['name' => 'view_users', 'label' => 'View Users'],
            ['name' => 'create_users', 'label' => 'Create Users'],
            ['name' => 'edit_users', 'label' => 'Edit Users'],
            ['name' => 'delete_users', 'label' => 'Delete Users'],
            ['name' => 'manage_waste', 'label' => 'Manage Waste'],
            ['name' => 'view_reports', 'label' => 'View Reports'],
            ['name' => 'manage_dispositions', 'label' => 'Manage Dispositions']
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                ['label' => $permission['label']]
            );
        }
    }
}