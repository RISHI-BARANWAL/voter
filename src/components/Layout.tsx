import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Database,
  CheckSquare,
  BarChart3,
  Search,
  Settings,
  MessageSquare,
  Upload,
  Download,
  Shield,
  FileText,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/users', icon: Users, roles: ['Super Admin', 'Admin'] },
    { name: 'Voter Data Entry', href: '/voters?tab=entry', icon: Database }, // ....new added  ?tab=entry
    { name: 'Task Management', href: '/tasks', icon: CheckSquare }, 
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Search & Filter', href: '/voters?tab=search', icon: Search },
    { name: 'SMS Module', href: '/sms', icon: MessageSquare },
    { name: 'Import/Export', href: '/voters?tab=import', icon: Upload, roles: ['Super Admin', 'Admin'] },
    // { name: 'Audit Logs', href: '/audit-logs', icon: Shield, roles: ['Super Admin', 'Admin'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['Super Admin', 'Admin'] },
  ];

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const isActive = (href: string) => {
    const [path, query] = href.split('?');
    const currentPath = location.pathname;
    const currentSearch = location.search;
    
    if (path === '/dashboard') {
      return currentPath === '/' || currentPath === '/dashboard';
    }
    
    if (query) {
      // For URLs with query parameters, match both path and query
      return currentPath === path && currentSearch === `?${query}`;
    }
    
    // For URLs without query parameters, just match the path
    return currentPath === path && !currentSearch;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:inset-y-0 ${  // lg:static lg:inset-0 ....new added
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">VoterAdmin</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    isActive(item.href) ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-2 text-xs text-center text-gray-500">
            System Administrator
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Welcome back, {user?.full_name}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}