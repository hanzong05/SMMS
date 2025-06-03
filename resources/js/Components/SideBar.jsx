import React, { useState } from "react";
import { 
  BarChart3, 
  FileText, 
  Recycle, 
  Settings, 
  TrendingUp, 
  Users, 
  LogOut, 
  Home,
  Package
} from "lucide-react";
import { Link, usePage } from '@inertiajs/react';

export default function Sidebar() {
    const { url } = usePage(); // Get current URL to determine active item
    const { user } = usePage().props.auth || {}; // Get user info for role-based navigation

    // Define navigation items based on user role
    const getNavigationItems = () => {
        const baseItems = [
            { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
            { id: 'process-waste', icon: Recycle, label: 'Process Waste', path: '/ProcessWaste' },
            { id: 'reports', icon: FileText, label: 'Reports', path: '/Reports' },
        ];

        // Add admin-only items if user is admin
        if (user?.role === 'admin') {
            baseItems.push(
                { id: 'user-management', icon: Users, label: 'User Management', path: '/UserManagement' },
                { id: 'waste-config', icon: Settings, label: 'Waste Config', path: '/WasteConfig' }
            );
        }

        return baseItems;
    };

    const navigationItems = getNavigationItems();

    // Determine active item based on current URL
    const getActiveItem = () => {
        if (url.startsWith('/dashboard')) return 'dashboard';
        if (url.startsWith('/ProcessWaste')) return 'process-waste';
        if (url.startsWith('/Reports')) return 'reports';
        if (url.startsWith('/UserManagement')) return 'user-management';
        if (url.startsWith('/WasteConfig')) return 'waste-config';
        return 'dashboard'; // default
    };

    const activeItem = getActiveItem();

    const handleLogout = () => {
        // Use Inertia to handle logout
        window.location.href = '/logout';
    };

    return (
        <div className="w-20 bg-white border-r border-gray-200 h-screen flex flex-col items-center py-6 shadow-sm">
            {/* Logo/Brand */}
            <Link href="/dashboard">
                <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white mb-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                    <Recycle className="h-8 w-8" />
                </div>
            </Link>

            {/* Navigation Icons */}
            <div className="flex-1 flex flex-col justify-between w-full px-2">
                <nav className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;
                        
                        return (
                            <Link
                                key={item.id}
                                href={item.path}
                                className={`
                                    group relative p-3 rounded-xl transition-all duration-200 cursor-pointer block
                                    ${isActive 
                                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' 
                                        : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-100'
                                    }
                                `}
                                title={item.label}
                            >
                                <Icon 
                                    className={`
                                        h-6 w-6 transition-colors
                                        ${isActive 
                                            ? 'text-blue-600' 
                                            : 'text-gray-500 group-hover:text-blue-600'
                                        }
                                    `} 
                                />
                                
                                {/* Tooltip */}
                                <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                    {item.label}
                                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                </div>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Icon at Bottom */}
                <div className="border-t border-gray-100 pt-4">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="group relative p-3 rounded-xl hover:bg-red-50 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-red-100 w-full"
                        title="Logout"
                    >
                        <LogOut className="h-6 w-6 text-gray-500 group-hover:text-red-500 transition-colors" />
                        
                        {/* Logout Tooltip */}
                        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Logout
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}