'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock, PieChart, FileText } from 'lucide-react';
import CommitLog from './CommitLog';
import ContributionChart from './ContributionChart';
import ReadmeGeneratorForm from './readme-generator/ReadmeGeneratorForm';
import Code from './Code';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import GitGraphs from './GitGraphs';
import CiCd from './CiCd';
import { Listbox } from '@headlessui/react';

type TabOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

const tabOptions: TabOption[] = [
  {
    value: 'commits',
    label: 'Commits',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: 'contributions',
    label: 'Contributions',
    icon: <PieChart className="h-4 w-4" />,
  },
  {
    value: 'git-graph',
    label: 'Git Graph',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <circle cx="6" cy="6" r="2" />
        <circle cx="18" cy="18" r="2" />
        <circle cx="6" cy="18" r="2" />
        <path d="M6 8v8a2 2 0 0 0 2 2h4" />
        <path d="M18 16V8a2 2 0 0 0-2-2h-4" />
      </svg>
    ),
  },
  {
    value: 'readme',
    label: 'README',
    icon: <FileText className="h-4 w-4" />,
  },
  {
    value: 'Code',
    label: 'Code',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
  {
    value: 'Ci/Cd',
    label: 'Ci/Cd generator',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 17v-2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
      </svg>
    ),
  },
];

type Props = {};

const CommitTabs = ({}: Props) => {
  const [activeTab, setActiveTab] = useState('commits');
  const { resolvedTheme } = useTheme();

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="w-full">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2
            className={cn(
              'text-xl font-semibold',
              resolvedTheme === 'dark' ? 'text-gray-100' : 'text-gray-800',
            )}
          >
            Project Activity
          </h2>
          {/* Desktop Tabs */}
          <TabsList className="hidden h-10 w-auto items-center gap-2 sm:flex">
            {tabOptions.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={cn(
                  'flex h-full items-center justify-center gap-2 px-4 py-2',
                  activeTab === tab.value && 'font-medium',
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {/* Mobile Dropdown */}
          <div className="w-full sm:hidden">
            <Listbox value={activeTab} onChange={setActiveTab}>
              <div className="relative">
                <Listbox.Button
                  className={cn(
                    'relative w-full cursor-pointer rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900/50',
                  )}
                >
                  <span className="flex items-center gap-2">
                    {tabOptions.find((t) => t.value === activeTab)?.icon}
                    {tabOptions.find((t) => t.value === activeTab)?.label}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-900/90 sm:text-sm">
                  {tabOptions.map((tab) => (
                    <Listbox.Option
                      key={tab.value}
                      value={tab.value}
                      className={({ active }: { active: boolean }) =>
                        cn(
                          'relative cursor-pointer select-none py-2 pl-10 pr-4',
                          active
                            ? 'bg-blue-100 text-blue-900 dark:bg-gray-800 dark:text-white'
                            : 'text-gray-900 dark:text-gray-100',
                        )
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className="absolute left-2 flex items-center">{tab.icon}</span>
                          <span
                            className={cn(
                              'block truncate',
                              selected ? 'font-medium' : 'font-normal',
                            )}
                          >
                            {tab.label}
                          </span>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
          </div>
        </div>

        <TabsContent value="commits" className="space-y-4">
          <CommitLog />
        </TabsContent>
        <TabsContent value="contributions" className="space-y-4">
          <div
            className={cn(
              'overflow-hidden rounded-lg p-4',
              resolvedTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white',
            )}
          >
            <ContributionChart />
          </div>
        </TabsContent>
        <TabsContent value="readme" className="space-y-4">
          <div
            className={cn(
              'overflow-hidden',
              resolvedTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white',
            )}
          >
            <ReadmeGeneratorForm />
          </div>
        </TabsContent>
        <TabsContent value="Code" className="space-y-4">
          <div
            className={cn(
              'overflow-hidden',
              resolvedTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white',
            )}
          >
            <Code />
          </div>
        </TabsContent>
        <TabsContent value="git-graph" className="space-y-4">
          <div
            className={cn(
              'overflow-hidden',
              resolvedTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white',
            )}
          >
            <GitGraphs />
          </div>
        </TabsContent>
        <TabsContent value="Ci/Cd" className="space-y-4">
          <div
            className={cn(
              'overflow-hidden',
              resolvedTheme === 'dark' ? 'bg-gray-900/50' : 'bg-white',
            )}
          >
            <CiCd />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommitTabs;
