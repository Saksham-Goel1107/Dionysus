'use client';

import React, { useState, useEffect } from 'react';
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
  ChartLine,
} from 'lucide-react';
import { useTheme } from 'next-themes';

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const theme = resolvedTheme;

  return (
    <button
      className={`flex w-full items-center justify-${collapsed ? 'center' : 'start'} mb-2 gap-2 rounded-md px-2 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800`}
      aria-label="Toggle dark/light mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M21 12.79A9 9 0 0 1 11.21 3a1 1 0 0 0-1.13 1.36A7 7 0 1 0 19.64 13.92a1 1 0 0 0 1.36-1.13Z"
          />
        </svg>
      ) : (
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

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/finances', label: 'Finances', icon: CreditCard },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/admin/coupons', label: 'Coupons', icon: Tag },
    { href: '/admin/surveys', label: 'Surveys', icon: ChartLine },
  ];

  return (
    <aside
      className={cn(
        'absolute z-10 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-950 md:relative',
        collapsed ? 'w-13 md:w-16' : 'w-64',
      )}
    >
      <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
        {!collapsed && (
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Admin Panel</h1>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

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
                    'flex items-center gap-3 rounded-md px-3 py-2 transition-colors',
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

      <div className="border-t border-gray-200 p-4 dark:border-gray-800">
        <ThemeToggle collapsed={collapsed} />
        <div className="mt-2 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
            A
          </div>
          {!collapsed && <span className="text-sm font-medium">Admin User</span>}
        </div>
      </div>
    </aside>
  );
}
