import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Shield, Bell, CreditCard, Link, Sparkles } from 'lucide-react';

const sections = [
  { id: 'profile', label: 'Profile', icon: User, description: 'Personal information' },
  { id: 'account', label: 'Account', icon: Settings, description: 'Account preferences' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Privacy & authentication' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email & alerts' },
  { id: 'billing', label: 'Billing', icon: CreditCard, description: 'Payments & subscriptions' },
  { id: 'integrations', label: 'Integrations', icon: Link, description: 'Connected services' },
];

export default function SettingsSidebar({
  current,
  onSelect,
}: {
  current: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="border-0 bg-white/80 shadow-2xl backdrop-blur-lg dark:bg-gray-800/80">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="mr-1 h-3 w-3" />
                Alpha
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <nav className="space-y-1">
          {sections.map((section) => {
            const IconComponent = section.icon;
            const isActive = current === section.id;

            return (
              <button
                key={section.id}
                className={`group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all duration-200 ${
                  isActive
                    ? 'scale-[1.02] transform bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:scale-[1.01] hover:transform hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/50'
                }`}
                onClick={() => onSelect(section.id)}
              >
                <div
                  className={`rounded-lg p-2 ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-gray-100 group-hover:bg-gray-200 dark:bg-gray-700 dark:group-hover:bg-gray-600'
                  }`}
                >
                  <IconComponent
                    className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      isActive ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {section.label}
                  </div>
                  <div
                    className={`truncate text-xs ${
                      isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {section.description}
                  </div>
                </div>
                {isActive && <div className="h-2 w-2 rounded-full bg-white shadow-lg"></div>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 pt-4 dark:border-gray-700">
          <div className="text-center">
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              ⚡ Enhanced with Alpha features
            </p>
            <div className="flex justify-center">
              <Badge variant="outline" className="text-xs">
                Premium Settings
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
