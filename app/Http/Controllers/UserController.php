<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Permission;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with('permissions')
                ->select(['id', 'name', 'email', 'role', 'department', 'status', 'last_login_at', 'created_at'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Format users with permissions
            $users = $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'department' => $user->department,
                    'status' => $user->status,
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'permissions' => $user->permissions->pluck('name')->toArray()
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|in:admin,supervisor,user',
            'department' => 'nullable|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role,
                'department' => $request->department,
                'status' => 'active',
            ]);

            // Attach permissions if provided
            if ($request->has('permissions') && is_array($request->permissions)) {
                $permissions = Permission::whereIn('name', $request->permissions)->get();
                $user->permissions()->sync($permissions->pluck('id'));
            }

            DB::commit();

            // Load permissions for response
            $user->load('permissions');
            $user->permissions = $user->permissions->pluck('name')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => 'required|in:admin,supervisor,user',
            'department' => 'nullable|string|max:255',
            'permissions' => 'array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        try {
            DB::beginTransaction();

            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'role' => $request->role,
                'department' => $request->department,
            ]);

            // Update permissions
            if ($request->has('permissions')) {
                if (is_array($request->permissions)) {
                    $permissions = Permission::whereIn('name', $request->permissions)->get();
                    $user->permissions()->sync($permissions->pluck('id'));
                } else {
                    // Clear all permissions if empty array or null
                    $user->permissions()->sync([]);
                }
            }

            DB::commit();

            // Load permissions for response
            $user->load('permissions');
            $user->permissions = $user->permissions->pluck('name')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::findOrFail($id);
            
            // Prevent deleting yourself
            if ($user->id === auth()->id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account'
                ], 400);
            }

            DB::beginTransaction();
            
            // Remove all permissions before deleting user
            $user->permissions()->detach();
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }
}