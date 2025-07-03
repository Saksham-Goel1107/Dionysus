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
        className={`hidden md:flex transition-all duration-300 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex-col ${
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
        {/* Search Bar */}
        {!collapsed && (
          <div className="px-4 py-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search channels..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
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

      {/* Mobile Topbar */}
      <div className="md:hidden w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-2 py-2 flex flex-col gap-2 sticky top-0 z-30">
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
            className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
        </div>
        {/* Horizontal scroll for channels */}
        <nav className="flex gap-2 overflow-x-auto pb-1 pt-1">
          {filteredChannels.map((channel) => {
            const isActive = currentSlug === channel.slug;
            return (
              <Link
                key={channel.slug}
                href={`/chatting/${channel.slug}`}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900'
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
