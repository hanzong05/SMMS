<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupervisorMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect('login');
        }

        if (!in_array($user->role, ['admin', 'supervisor'])) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. Supervisor role or higher required.',
                    'error' => 'INSUFFICIENT_PERMISSIONS'
                ], 403);
            }
            abort(403, 'Access denied. Supervisor role or higher required.');
        }

        return $next($request);
    }
}