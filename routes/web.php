<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WasteController;
use App\Http\Controllers\WasteConfigController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

/*
|--------------------------------------------------------------------------
| Routes accessible to ALL authenticated users (including view-only)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Dashboard - everyone can access
    Route::get('/dashboard', function () {
        $user = Auth::user();
        $isViewOnly = $user->permission_level === 'view';
        $canEdit = $user->permission_level === 'edit';
        
        return Inertia::render('Dashboard', [
            'user' => $user,
            'permissions' => [
                'canCreate' => $canEdit,
                'canEdit' => $canEdit,
                'canDelete' => $canEdit,
                'isViewOnly' => $isViewOnly,
                'isAdmin' => $user->role === 'admin',
                'isSupervisor' => in_array($user->role, ['admin', 'supervisor']),
            ]
        ]);
    })->name('dashboard');

    // Process Waste (View Mode) - everyone can view
    Route::get('/ProcessWaste', function () {
        $user = Auth::user();
        $isViewOnly = $user->permission_level === 'view';
        $canEdit = $user->permission_level === 'edit';
        
        return Inertia::render('User/ProcessWaste', [
            'user' => $user,
            'permissions' => [
                'canCreate' => $canEdit,
                'canEdit' => $canEdit,
                'canDelete' => $canEdit,
                'isViewOnly' => $isViewOnly,
            ]
        ]);
    })->name('ProcessWaste');

    // Reports - everyone can view
    Route::get('/Reports', function () {
        $user = Auth::user();
        $isViewOnly = $user->permission_level === 'view';
        $canEdit = $user->permission_level === 'edit';
        
        return Inertia::render('Public/Reports', [
            'user' => $user,
            'permissions' => [
                'canExport' => $canEdit,
                'canCreateCustom' => $canEdit,
                'isViewOnly' => $isViewOnly,
            ]
        ]);
    })->name('Reports');

    // Check submission route - read-only operation
    Route::get('/check-submission', function (Request $request) {
        $submitted = \App\Models\Waste::where('InputBy', $request->user_name)
            ->whereDate('created_at', today())
            ->exists();

        return response()->json(['submitted' => $submitted]);
    });
});

/*
|--------------------------------------------------------------------------
| Routes requiring WRITE permissions (blocked for view-only users)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'permissions:write'])->group(function () {
    // Waste management routes (write operations)
    Route::post('/wastes', [WasteController::class, 'store']);
    Route::put('/wastes/{id}', [WasteController::class, 'update']);
    Route::delete('/wastes/{id}', [WasteController::class, 'destroy']);
});

/*
|--------------------------------------------------------------------------
| SUPERVISOR and ADMIN routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'permissions:supervisor'])->group(function () {
    // Advanced Analytics - supervisor and admin only
    Route::get('/AdvancedAnalytics', function () {
        return Inertia::render('Public/AdvancedAnalytics', [
            'user' => Auth::user()
        ]);
    })->name('AdvancedAnalytics');
});

/*
|--------------------------------------------------------------------------
| ADMIN-ONLY routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'permissions:admin'])->group(function () {
    // Waste Configuration - admin only
    Route::get('/WasteConfig', function(){
        return Inertia::render('Admin/WasteConfigManager',[
            'user' => Auth::user()
        ]);
    })->name('WasteConfigManager');

    // User Management - admin only
    Route::get('/UserManagement', function () {
        return Inertia::render('Admin/UserManagement', [
            'user' => Auth::user()
        ]);
    })->name('UserManagement');
});

/*
|--------------------------------------------------------------------------
| API Routes with Permission Controls
|--------------------------------------------------------------------------
*/
Route::prefix('api')->middleware(['auth'])->group(function () {
    
    // READ-ONLY API Routes (accessible to all authenticated users)
    Route::get('/waste-types', [WasteConfigController::class, 'getWasteTypes']);
    Route::get('/dispositions', [WasteConfigController::class, 'getDispositions']);
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/wastes', [WasteController::class, 'index']);
    Route::get('/wastes/{id}', [WasteController::class, 'show']);
    
    // Waste reports with filtered data for view-only users
    Route::get('/waste-reports', function () {
        try {
            $user = Auth::user();
            $isViewOnly = $user->permission_level === 'view';
            
            $query = DB::table('wastes')
                ->select([
                    'id',
                    'TypeOfWaste',
                    'Disposition',
                    'Weight',
                    'Unit',
                    'InputBy',
                    'VerifiedBy',
                    'created_at',
                    'updated_at'
                ])
                ->orderBy('created_at', 'desc');
            
            // For view-only users, limit data access
            if ($isViewOnly) {
                // Only show their own records
                $query->where('InputBy', $user->name);
            }
            
            $reports = $query->get();
            
            return response()->json([
                'success' => true,
                'data' => $reports,
                'permissions' => [
                    'canExport' => !$isViewOnly,
                    'canEdit' => !$isViewOnly,
                    'canDelete' => !$isViewOnly,
                    'isViewOnly' => $isViewOnly,
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve waste reports: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    });
    
    // WRITE OPERATIONS - Blocked for view-only users
    Route::middleware(['permissions:write'])->group(function () {
        // Waste Type Management
        Route::post('/waste-types', [WasteConfigController::class, 'storeWasteType']);
        Route::put('/waste-types/{id}', [WasteConfigController::class, 'updateWasteType']);
        Route::delete('/waste-types/{id}', [WasteConfigController::class, 'deleteWasteType']);

        // Dispositions Management
        Route::post('/dispositions', [WasteConfigController::class, 'storeDisposition']);
        Route::put('/dispositions/{id}', [WasteConfigController::class, 'updateDisposition']);
        Route::delete('/dispositions/{id}', [WasteConfigController::class, 'deleteDisposition']);
    });
    
    // ADMIN-ONLY API Routes
    Route::middleware(['permissions:admin'])->group(function () {
        // User Management API Routes
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/{id}/update-login', [UserController::class, 'updateLastLogin']);
    });
});

/*
|--------------------------------------------------------------------------
| Profile Routes (accessible to all authenticated users)
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';