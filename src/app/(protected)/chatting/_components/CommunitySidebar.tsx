'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const channels = [
  { name: 'General', slug: 'General' },
  { name: 'Help', slug: 'Help' },
  { name: 'Showcase', slug: 'Showcase' },
  { name: 'Random', slug: 'Random' },
];

const CommunitySidebar = () => {
  const pathname = usePathname() || '';
  const currentSlug = pathname.split('/').pop();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');

  // Filter channels by search
  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 md:flex ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-4 dark:border-gray-700">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Community</h2>
          )}
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        {/* Search Bar */}
        {!collapsed && (
          <div className="px-4 py-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search channels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
        {/* Channels */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          {filteredChannels.map((channel) => {
            const isActive = currentSlug === channel.slug;

            return (
              <Link
                key={channel.slug}
                href={`/chatting/${channel.slug}`}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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

      {/* Mobile Topbar */}
      <div className="sticky top-0 z-30 flex w-full flex-col gap-2 border-b border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900 md:hidden">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Community</h2>
          <div className="flex-1" />
        </div>
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search channels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        {/* Horizontal scroll for channels */}
        <nav className="flex gap-2 overflow-x-auto pb-1 pt-1">
          {filteredChannels.map((channel) => {
            const isActive = currentSlug === channel.slug;
            return (
              <Link
                key={channel.slug}
                href={`/chatting/${channel.slug}`}
                className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-blue-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-blue-900'
                }`}
              >
                #{channel.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default CommunitySidebar;
