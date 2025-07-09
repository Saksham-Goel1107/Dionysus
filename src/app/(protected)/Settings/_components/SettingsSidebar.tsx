import React from 'react';

const sections = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'account', label: 'Account', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'integrations', label: 'Integrations', icon: '🔗' },
];

export default function SettingsSidebar({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-white dark:bg-gray-900 py-4 px-2 md:px-4 flex flex-col md:min-h-[70vh] shadow-sm">
      <h1 className="text-xl md:text-2xl font-bold text-blue-700 dark:text-blue-300 mb-4 text-center md:text-left">
        Settings
      </h1>

      {/* Scrollable nav on mobile with snap */}
      <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible justify-start md:justify-start scroll-snap-x scroll-smooth whitespace-nowrap">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`flex items-center gap-2 px-3 py-2 text-sm md:text-base rounded-lg transition font-medium scroll-snap-align-start ${
              current === section.id
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200'
            }`}
            onClick={() => onSelect(section.id)}
          >
            <span className="text-lg">{section.icon}</span>
            <span>{section.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
