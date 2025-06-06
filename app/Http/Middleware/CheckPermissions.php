<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckPermissions
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @param  string|null  $permission
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next, $permission = null)
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect('login');
        }

        // Handle different permission types
        switch ($permission) {
            case 'admin':
                if ($user->role !== 'admin') {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'message' => 'Access denied. Admin role required.',
                            'error' => 'INSUFFICIENT_PERMISSIONS'
                        ], 403);
                    }
                    abort(403, 'Access denied. Admin role required.');
                }
                break;
                
            case 'supervisor':
                if (!in_array($user->role, ['admin', 'supervisor'])) {
                    if ($request->expectsJson()) {
                        return response()->json([
                            'message' => 'Access denied. Supervisor role or higher required.',
                            'error' => 'INSUFFICIENT_PERMISSIONS'
                        ], 403);
                    }
                    abort(403, 'Access denied. Supervisor role or higher required.');
                }
                break;
                
            case 'write':
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
                break;
        }

        return $next($request);
    }
}