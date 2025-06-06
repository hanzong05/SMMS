<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WritePermissionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect('login');
        }

        if ($user->permission_level === 'view') {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. You have view-only permissions.',
                    'error' => 'INSUFFICIENT_PERMISSIONS'
                ], 403);
            }
            
            if ($request->isMethod('post') || $request->isMethod('put') || $request->isMethod('delete')) {
                return response()->json([
                    'message' => 'Access denied. You have view-only permissions.',
                    'error' => 'INSUFFICIENT_PERMISSIONS'
                ], 403);
            }
            
            return redirect()->back()->with('error', 'Access denied. You have view-only permissions.');
        }

        return $next($request);
    }
}