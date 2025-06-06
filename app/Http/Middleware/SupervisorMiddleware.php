<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupervisorMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated',
                    'error' => 'UNAUTHENTICATED'
                ], 401);
            }
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