<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WritePermissionMiddleware
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

        // Check if user has view-only permissions
        if ($user->permission_level === 'view') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. You have view-only permissions.',
                    'error' => 'INSUFFICIENT_PERMISSIONS'
                ], 403);
            }
            
            // For web requests, redirect back with error
            return redirect()->back()->with('error', 'Access denied. You have view-only permissions.');
        }

        return $next($request);
    }
}