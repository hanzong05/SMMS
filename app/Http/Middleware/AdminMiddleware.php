<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect('login');
        }

        if ($user->role !== 'admin') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. Admin role required.',
                    'error' => 'INSUFFICIENT_PERMISSIONS'
                ], 403);
            }
            abort(403, 'Access denied. Admin role required.');
        }

        return $next($request);
    }
}