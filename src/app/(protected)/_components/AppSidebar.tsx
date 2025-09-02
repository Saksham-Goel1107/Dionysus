'use client';

import { Logo } from '@/app/components/logo';
import GradientTypewriter from '@/components/mvpblocks/gradient-typewriter';
import { N8nRegistrationModal } from '@/components/n8n-registration/N8nRegistrationModal';
import { Button } from '@/components/ui/button';
import { ThemeSwitcher } from '@/components/ui/kibo-ui/theme-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import useProject from '@/hooks/use-project';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import DOMPurify from 'dompurify';
import {
  Bot,
  CircleDollarSign,
  Cog,
  CreditCard,
  LayoutDashboard,
  Plus,
  Presentation,
  Workflow,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import LastUpdated from './LastUpdated';

type Props = {};

type SidebarItem = {
  title: string;
  url: string;
  icon: React.ElementType;
  isChat?: boolean;
  isN8n?: boolean;
};

const items: SidebarItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Q&A',
    url: '/qa',
    icon: Bot,
  },
  {
    title: 'Meetings',
    url: '/meetings',
    icon: Presentation,
  },
  {
    title: 'Advanced',
    url: '/advanced',
    icon: Plus,
  },
  {
    title: 'n8n Instance',
    url: '#',
    icon: Workflow,
    isN8n: true,
  },
  {
    title: 'Billing',
    url: '/billing',
    icon: CreditCard,
  },
  {
    title: 'Subscriptions',
    url: '/subscriptions',
    icon: CircleDollarSign,
  },
  {
    title: 'Settings',
    url: '/Settings',
    icon: Cog,
  },
];

const AppSidebar = ({}: Props) => {
  const pathname = usePathname();
  const { projects, projectId, setProjectId } = useProject();
  const router = useRouter();

  useEffect(() => {
    if (!projectId) return;
    if (projects && !projects.some((p) => p.id === projectId)) {
      setProjectId('');
      router.replace('/dashboard');
    }
  }, [projectId, projects, setProjectId, router]);
  const { data: members } = api.project.getTeamMembers.useQuery({ projectId });
  const { open, setOpen } = useSidebar();
  useEffect(() => {
    const handleCtrlB = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        if (typeof setOpen === 'function') setOpen(!open);
      }
    };
    window.addEventListener('keydown', handleCtrlB);
    return () => {
      window.removeEventListener('keydown', handleCtrlB);
    };
  }, [setOpen, open]);
  const [search, setSearch] = useState('');
  const [hasProPlan, sethasProPlan] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showN8nModal, setShowN8nModal] = useState(false);
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get('n8n_modal') === 'open') {
      setShowN8nModal(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!router) return;
    const url = new URL(window.location.href);
    if (showN8nModal) {
      url.searchParams.set('n8n_modal', 'open');
      router.replace(url.pathname + url.search, { scroll: false });
    } else {
      if (url.searchParams.has('n8n_modal')) {
        url.searchParams.delete('n8n_modal');
        router.replace(url.pathname + url.search, { scroll: false });
      }
    }
  }, [showN8nModal, router]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { setTheme } = useTheme();

  const users = Array.isArray(members) ? members : [];
  const showChat = users.length >= 2 && !!projectId;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/pro-status');
        if (!res.ok) throw new Error('Failed to fetch pro status');
        const data = await res.json();
        sethasProPlan(data.pro);
      } catch {
        sethasProPlan(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
        if (open && searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleCreateProjectClick = (e: React.MouseEvent) => {
    if (!hasProPlan && (projects?.length || 0) >= 5) {
      e.preventDefault();
      setShowProModal(true);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <Link href={'/'}>
          <div className="flex items-center justify-center gap-2">
            <Logo />
            {open && <GradientTypewriter words="Dionysus" />}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(() => {
                const settingsIdx = items.findIndex((item) => item.title === 'Settings');
                const beforeSettings = items.slice(0, settingsIdx);
                const settingsItem = items[settingsIdx];
                let menuItems = [...beforeSettings];
                if (showChat) {
                  menuItems.push({
                    title: 'Chat',
                    url: '/chat',
                    icon: Bot,
                    isChat: true,
                  });
                }
                if (settingsItem) {
                  menuItems.push(settingsItem);
                }
                return menuItems.map((item) => {
                  if (item.isChat) {
                    return (
                      <SidebarMenuItem key="Chat">
                        <SidebarMenuButton asChild>
                          <Link
                            href="/chat"
                            className={cn({
                              '!bg-primary !text-white': pathname === '/chat',
                            })}
                          >
                            <Bot />
                            <span>Video Call + Chat</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                  if (item.isN8n) {
                    return (
                      <SidebarMenuItem key="n8n">
                        <SidebarMenuButton asChild>
                          <button
                            onClick={() => setShowN8nModal(true)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                            aria-label="Open n8n registration modal"
                          >
                            <item.icon />
                            <span>{item.title}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={cn({
                            '!bg-primary !text-white': pathname === item.url,
                          })}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                });
              })()}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            {open && (
              <div className="mb-2 px-2">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search projects..."
                    value={search}
                    onChange={(e) => setSearch(DOMPurify.sanitize(e.target.value))}
                    maxLength={10}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-1 pr-20 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
                  />
                  <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {search && (
                      <button
                        aria-label="Clear search"
                        className="mr-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-400"
                        style={{ fontSize: 14, lineHeight: 1 }}
                        onClick={() => setSearch('')}
                        tabIndex={0}
                        type="button"
                      >
                        &#10005;
                      </button>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                      {typeof window !== 'undefined' &&
                      navigator.platform.toLowerCase().includes('mac') ? (
                        <>
                          ⌘ <span className="ml-0.5">K</span>
                        </>
                      ) : (
                        <>
                          Ctrl <span className="ml-0.5">K</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <SidebarMenu>
              {(() => {
                const filtered =
                  projects?.filter((project) =>
                    project.name.toLowerCase().includes(search.toLowerCase()),
                  ) || [];
                if (filtered.length === 0) {
                  return (
                    <SidebarMenuItem>
                      <div
                        className={cn(
                          'w-full select-none text-center text-sm text-gray-400 dark:text-gray-500',
                          open ? 'px-3 py-2' : 'px-1 py-2 text-xs',
                        )}
                      >
                        {open ? 'Nothing available' : 'No data'}
                      </div>
                    </SidebarMenuItem>
                  );
                }
                return filtered.map((project) => (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton asChild>
                      <div onClick={() => setProjectId(project.id)}>
                        <div
                          className={cn(
                            'flex size-6 cursor-pointer items-center justify-center rounded-sm border bg-white text-sm text-primary',
                            {
                              'cursor-pointer bg-primary text-white': project.id === projectId,
                              'px-2': !open,
                            },
                          )}
                        >
                          {project.name[0]}
                        </div>
                        <span className="cursor-pointer">{project.name}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ));
              })()}

              <div className="h-2"></div>

              {open && (
                <SidebarMenuItem>
                  <Link href="/create" onClick={handleCreateProjectClick}>
                    <Button size="sm" variant={'outline'} className="w-fit">
                      <Plus />
                      Create Project
                    </Button>
                  </Link>
                </SidebarMenuItem>
              )}
              {open && (
                <>
                  <SidebarMenuItem>
                    <div
                      className={`px-2 py-1 text-xs ${!hasProPlan && projects.length >= 3 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {hasProPlan
                        ? `${projects?.length || 0}/Unlimited projects`
                        : `${projects?.length || 0} / 5 projects`}
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <ThemeSwitcher
                      defaultValue="system"
                      onChange={(theme) => {
                        if (typeof window !== 'undefined') {
                          setTheme(theme);
                        }
                      }}
                    />
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <LastUpdated />
                  </SidebarMenuItem>
                </>
              )}
              {showProModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                  <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Premium Required
                    </h3>
                    <p className="mb-6 text-sm text-gray-700 dark:text-gray-300">
                      You have reached the free projects limit. Please upgrade to Premium for
                      unlimited projects.
                    </p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowProModal(false)}>
                        Cancel
                      </Button>
                      <Link href="/subscriptions">
                        <Button variant="destructive">Go Premium</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <N8nRegistrationModal isOpen={showN8nModal} onClose={() => setShowN8nModal(false)} />
    </Sidebar>
  );
};

export default AppSidebar;
