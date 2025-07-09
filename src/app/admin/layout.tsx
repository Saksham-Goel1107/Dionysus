'use client';

import React, { useState } from 'react';
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

        {/* User */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
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
