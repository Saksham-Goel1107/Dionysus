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
    <aside className="flex w-full flex-col border-b bg-white px-2 py-4 shadow-sm dark:bg-gray-900 md:min-h-[70vh] md:w-64 md:border-b-0 md:border-r md:px-4">
      <h1 className="mb-4 text-center text-xl font-bold text-blue-700 dark:text-blue-300 md:text-left md:text-2xl">
        Settings
      </h1>

      {/* Scrollable nav on mobile with snap */}
      <nav className="scroll-snap-x flex flex-row justify-start gap-2 overflow-x-auto scroll-smooth whitespace-nowrap md:flex-col md:justify-start md:overflow-visible">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`scroll-snap-align-start flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition md:text-base ${
              current === section.id
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
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
