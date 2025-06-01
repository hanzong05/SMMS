<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WasteController;
use App\Http\Controllers\WasteConfigController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
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

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/ProcessWaste', function () {
    return Inertia::render('User/ProcessWaste', [
        'user' => Auth::user()
    ]);
})->middleware(['auth', 'verified'])->name('ProcessWaste');

Route::get('/WasteConfig', function(){
    return Inertia::render('Admin/WasteConfigManager',[
        'user' => Auth::user()
    ]);
})->middleware(['auth','verified'])->name('WasteConfigManager');

// Check submission route - Fixed the field name
Route::get('/check-submission', function (Request $request) {
    $submitted = \App\Models\Waste::where('InputBy', $request->user_name) // Fixed: InputBy instead of inputBy
        ->whereDate('created_at', today())
        ->exists();

    return response()->json(['submitted' => $submitted]);
})->middleware(['auth']);

// API Routes for waste configuration
Route::prefix('api')->middleware(['auth'])->group(function () {
    // Waste Types Routes
    Route::get('/waste-types', [WasteConfigController::class, 'getWasteTypes']);
    Route::post('/waste-types', [WasteConfigController::class, 'storeWasteType']);
    Route::put('/waste-types/{id}', [WasteConfigController::class, 'updateWasteType']);
    Route::delete('/waste-types/{id}', [WasteConfigController::class, 'deleteWasteType']);

    // Dispositions Routes
    Route::get('/dispositions', [WasteConfigController::class, 'getDispositions']);
    Route::post('/dispositions', [WasteConfigController::class, 'storeDisposition']);
    Route::put('/dispositions/{id}', [WasteConfigController::class, 'updateDisposition']);
    Route::delete('/dispositions/{id}', [WasteConfigController::class, 'deleteDisposition']);
});

// Waste management routes
Route::middleware(['auth'])->group(function () {
    // Main waste CRUD routes
    Route::post('/wastes', [WasteController::class, 'store']);
    Route::get('/wastes', [WasteController::class, 'index']);
    Route::get('/wastes/{id}', [WasteController::class, 'show']);
    Route::put('/wastes/{id}', [WasteController::class, 'update']);
    Route::delete('/wastes/{id}', [WasteController::class, 'destroy']);
});

// Profile routes
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';