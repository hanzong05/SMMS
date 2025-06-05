<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckPermissions
{
    public function handle(Request $request, Closure $next, $permission = null)
    {
        $user = Auth::user();
        
        if (!$user) {
            return redirect('login');
        }

        // Determine which permission check to perform based on route name
        $routeName = $request->route()->getName();
        $middleware = $this->getMiddlewareFromRoute($request);
        
        switch ($middleware) {
            case 'admin':
                if ($user->role !== 'admin') {
                    abort(403, 'Access denied. Admin role required.');
                }
                break;
                
            case 'supervisor':
                if (!in_array($user->role, ['admin', 'supervisor'])) {
                    abort(403, 'Access denied. Supervisor role or higher required.');
                }
                break;
                
            case 'write':
                if ($user->permission_level === 'view only' || $user->permission_level === 'view_only') {
                    abort(403, 'Access denied. Write permissions required.');
                }
                break;
        }

        return $next($request);
    }
    
    private function getMiddlewareFromRoute($request)
    {
        $route = $request->route();
        $middleware = $route->gatherMiddleware();
        
        // Find which of our custom middleware is being used
        foreach ($middleware as $m) {
            if (in_array($m, ['admin', 'supervisor', 'write'])) {
                return $m;
            }
        }
        
        return null;
    }
}