'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, Lock } from 'lucide-react';

const channels = [
  { name: 'General', slug: 'general' },
  { name: 'Help', slug: 'help' },
  { name: 'Showcase', slug: 'showcase' },
  { name: 'Random', slug: 'random' },
];

const CommunitySidebar = () => {
  const pathname = usePathname() || '';
  const currentSlug = pathname.split('/').pop();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={`transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b dark:border-gray-700">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Community</h2>
          )}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Channels */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {channels.map((channel) => {
            const isActive = currentSlug === channel.slug;

            return (
              <Link
                key={channel.slug}
                href={`/chatting/${channel.slug}`}
                className={`group flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
                title={collapsed ? channel.name : ''}
              >
                <span className="text-lg">#</span>
                {!collapsed && <span>{channel.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default CommunitySidebar;
