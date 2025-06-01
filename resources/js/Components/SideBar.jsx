import React, { useState } from "react";
import { 
  BarChart3, 
  FileText, 
  Recycle, 
  Zap, 
  TrendingUp, 
  Users, 
  LogOut, 
  Home,
  Settings
} from "lucide-react";

export default function Sidebar() {
    const [activeItem, setActiveItem] = useState('waste'); // Track active navigation item

    const navigationItems = [
        { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
        { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { id: 'reports', icon: FileText, label: 'Reports', path: '/reports' },
        { id: 'waste', icon: Recycle, label: 'Waste Management', path: '/waste', active: true },
        { id: 'efficiency', icon: Zap, label: 'Efficiency', path: '/efficiency' },
        { id: 'trends', icon: TrendingUp, label: 'Trends', path: '/trends' },
        { id: 'team', icon: Users, label: 'Team', path: '/team' },
        { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
    ];

    const handleNavClick = (itemId) => {
        setActiveItem(itemId);
        // Here you would typically handle navigation
        console.log(`Navigating to: ${itemId}`);
    };

    return (
        <div className="w-20 bg-white border-r border-gray-200 h-screen flex flex-col items-center py-6 shadow-sm">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 text-white mb-8 shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <Recycle className="h-8 w-8" />
            </div>

            {/* Navigation Icons */}
            <div className="flex-1 flex flex-col justify-between w-full px-2">
                <nav className="space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeItem === item.id;
                        
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                className={`
                                    group relative p-3 rounded-xl transition-all duration-200 cursor-pointer
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
                            </div>
                        );
                    })}
                </nav>

                {/* Logout Icon at Bottom */}
                <div className="border-t border-gray-100 pt-4">
                    <div
                        className="group relative p-3 rounded-xl hover:bg-red-50 transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-red-100"
                        title="Logout"
                    >
                        <LogOut className="h-6 w-6 text-gray-500 group-hover:text-red-500 transition-colors" />
                        
                        {/* Logout Tooltip */}
                        <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            Logout
                            <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}