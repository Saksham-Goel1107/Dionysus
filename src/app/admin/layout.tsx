'use client';

import React, { useState, useEffect } from 'react';
// Simple theme toggle using localStorage and document.documentElement.classList
function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  return (
    <button
      className={`w-full flex items-center justify-${collapsed ? 'center' : 'start'} gap-2 px-2 py-2 mb-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
      aria-label="Toggle dark/light mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        // Moon icon for dark mode
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M21 12.79A9 9 0 0 1 11.21 3a1 1 0 0 0-1.13 1.36A7 7 0 1 0 19.64 13.92a1 1 0 0 0 1.36-1.13Z"
          />
        </svg>
      ) : (
        // Sun icon for light mode
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </g>
        </svg>
      )}
      {!collapsed && (
        <span className="text-sm font-medium">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
      )}
    </button>
  );
}
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/finances', label: 'Finances', icon: CreditCard },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  ];

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={cn(
          'md:relative absolute z-10 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col',
          collapsed ? 'md:w-16 w-13' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          {!collapsed && (
            <h1 className="font-bold text-xl text-blue-600 dark:text-blue-400">Admin Panel</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                    )}
                  >
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme Toggle & User */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <ThemeToggle collapsed={collapsed} />
          <div className="flex items-center gap-3 mt-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
              S
            </div>
            {!collapsed && <span className="font-medium text-sm">Saksham Goel</span>}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
