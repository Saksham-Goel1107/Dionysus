'use client';

import { useFeatureFlag } from 'configcat-react';
import { AlertCircle, AlertTriangle, Bell, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types for announcements
interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isNew?: boolean;
}

const getTypeIcon = (type: Announcement['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
};

const getTypeStyles = (type: Announcement['type']) => {
  switch (type) {
    case 'success':
      return 'border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20';
    case 'warning':
      return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20';
    case 'error':
      return 'border-l-red-500 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20';
    default:
      return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20';
  }
};

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const isValidAnnouncement = (ann: any): ann is Announcement => {
  return (
    ann &&
    typeof ann === 'object' &&
    typeof ann.id === 'string' &&
    ann.id.trim() &&
    typeof ann.title === 'string' &&
    ann.title.trim() &&
    typeof ann.message === 'string' &&
    ann.message.trim() &&
    typeof ann.type === 'string' &&
    ['info', 'success', 'warning', 'error'].includes(ann.type) &&
    typeof ann.timestamp === 'string' &&
    ann.timestamp.trim()
  );
};

export default function AnnouncementBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [readAnnouncements, setReadAnnouncements] = useState<Set<string>>(new Set());
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // ConfigCat feature flags
  const { value: isAnnouncementsEnabled } = useFeatureFlag('announcements-enabled', false);
  const { value: announcementsConfig } = useFeatureFlag('announcements-config', '');

  // Parse announcements from ConfigCat
  useEffect(() => {
    if (isAnnouncementsEnabled) {
      if (
        announcementsConfig &&
        typeof announcementsConfig === 'string' &&
        announcementsConfig.trim()
      ) {
        try {
          const trimmedConfig = announcementsConfig.trim();
          if (!trimmedConfig.startsWith('[') || !trimmedConfig.endsWith(']')) {
            console.warn('Announcements config must be a valid JSON array');
            setAnnouncements([]);
            return;
          }

          const parsed = JSON.parse(trimmedConfig) as Announcement[];
          if (Array.isArray(parsed)) {
            if (parsed.length === 0) {
              // Empty array is valid - show empty state
              setAnnouncements([]);
              return;
            }

            // Validate that all required fields are present
            const validAnnouncements = parsed.filter(isValidAnnouncement);

            if (validAnnouncements.length > 0) {
              // Sort announcements by timestamp (newest first)
              const sortedAnnouncements = validAnnouncements.sort(
                (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
              );
              setAnnouncements(sortedAnnouncements);
              return;
            } else {
              console.warn('No valid announcements found in config');
              setAnnouncements([]);
            }
          } else {
            console.warn('Announcements config must be an array');
            setAnnouncements([]);
          }
        } catch (error) {
          console.error('Error parsing announcements config:', error);
          console.warn('Invalid JSON in announcements config');
          setAnnouncements([]);
        }
      } else {
        // No config provided - show empty state
        setAnnouncements([]);
      }
    } else {
      // Feature disabled - show empty state
      setAnnouncements([]);
    }
  }, [isAnnouncementsEnabled, announcementsConfig]);

  // Load read announcements from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('read-announcements');
      if (stored) {
        try {
          const parsedIds = JSON.parse(stored);
          setReadAnnouncements(new Set(parsedIds));
        } catch (error) {
          console.error('Error parsing read announcements:', error);
        }
      }
    }
  }, []);

  // Save read announcements to localStorage
  const saveReadAnnouncements = (newReadIds: Set<string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('read-announcements', JSON.stringify([...newReadIds]));
    }
  };

  // Mark announcement as read
  const markAsRead = (announcementId: string) => {
    const newReadIds = new Set([...readAnnouncements, announcementId]);
    setReadAnnouncements(newReadIds);
    saveReadAnnouncements(newReadIds);
  };

  // Mark all as read
  const markAllAsRead = () => {
    const allIds = new Set(announcements.map((a) => a.id));
    setReadAnnouncements(allIds);
    saveReadAnnouncements(allIds);
  };

  // Mark announcement as unread
  const markAsUnread = (announcementId: string) => {
    const newReadIds = new Set([...readAnnouncements]);
    newReadIds.delete(announcementId);
    setReadAnnouncements(newReadIds);
    saveReadAnnouncements(newReadIds);
  };

  // Mark all as unread
  const markAllAsUnread = () => {
    setReadAnnouncements(new Set());
    saveReadAnnouncements(new Set());
  };

  // Get unread count
  const unreadCount = announcements.filter((a) => !readAnnouncements.has(a.id)).length;

  if (process.env.NODE_ENV === 'development') return null;
  if (!isAnnouncementsEnabled) {
    return null;
  }

  return (
    <>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:ring-offset-2 active:scale-95 sm:h-14 sm:w-14"
        aria-label={`Announcements${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12 sm:h-6 sm:w-6" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-md ring-2 ring-white sm:h-6 sm:w-6 sm:text-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Announcement Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-start p-2 sm:p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-xs transform transition-all duration-300 ease-out animate-in zoom-in-95 slide-in-from-left-5 sm:max-w-md lg:max-w-lg">
            <div className="rounded-xl border border-gray-200/80 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur-md dark:border-gray-700/80 dark:bg-gray-800/95 dark:ring-white/10">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-200/80 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-4 dark:border-gray-700/80 dark:from-blue-900/20 dark:to-indigo-900/20 sm:p-5">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                    <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Announcements
                    </h2>
                    {unreadCount > 0 && (
                      <span className="mt-0.5 inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                    >
                      Mark all read
                    </button>
                  )}
                  {unreadCount < announcements.length && announcements.length > 0 && (
                    <button
                      onClick={markAllAsUnread}
                      className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700/30 dark:hover:text-gray-300"
                    >
                      Mark all unread
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Announcements List */}
              <div className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 max-h-80 overflow-y-auto sm:max-h-96">
                {announcements.length === 0 ? (
                  <div className="p-8 text-center sm:p-12">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                      <Bell className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">
                      No announcements yet
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      We&apos;ll notify you when there are updates
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200/60 dark:divide-gray-700/60">
                    {announcements.map((announcement: Announcement) => {
                      const isRead = readAnnouncements.has(announcement.id);
                      return (
                        <div
                          key={announcement.id}
                          className={`group relative p-4 transition-all duration-200 sm:p-5 ${
                            !isRead
                              ? 'bg-gradient-to-r from-blue-50/70 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/10'
                              : 'hover:bg-gray-50/50 dark:hover:bg-gray-700/30'
                          }`}
                        >
                          {/* Unread indicator bar */}
                          {!isRead && (
                            <div className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                          )}

                          <div
                            className={`border-l-4 pl-4 sm:pl-5 ${getTypeStyles(announcement.type)} rounded-r-lg transition-all duration-200`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-start space-x-3">
                                <div className="mt-0.5 flex-shrink-0">
                                  {getTypeIcon(announcement.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-white sm:text-base">
                                      {announcement.title}
                                    </h3>
                                    {!isRead && (
                                      <span className="relative flex h-2 w-2">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {announcement.message}
                                  </p>
                                  <div className="mt-3 flex items-center justify-between">
                                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                      {formatDate(announcement.timestamp)}
                                    </p>
                                    <div className="flex gap-2">
                                      {!isRead ? (
                                        <button
                                          onClick={() => markAsRead(announcement.id)}
                                          className="rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-blue-600 opacity-0 shadow-sm transition-opacity duration-200 hover:bg-white hover:text-blue-700 group-hover:opacity-100 dark:bg-gray-800/80 dark:text-blue-400 dark:hover:bg-gray-700 dark:hover:text-blue-300"
                                        >
                                          Mark read
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => markAsUnread(announcement.id)}
                                          className="rounded-md bg-white/80 px-2 py-1 text-xs font-medium text-gray-600 opacity-0 shadow-sm transition-opacity duration-200 hover:bg-white hover:text-gray-700 group-hover:opacity-100 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                                        >
                                          Mark unread
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200/80 bg-gray-50/50 p-3 dark:border-gray-700/80 dark:bg-gray-800/50 sm:p-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400"></div>
                  <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                    Stay updated with the latest news and features
                  </p>
                  <div
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400"
                    style={{ animationDelay: '0.5s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
