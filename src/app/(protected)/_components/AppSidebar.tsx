"use client";

import { Button } from "@/components/ui/button";
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
} from "@/components/ui/sidebar";
import useProject from "@/hooks/use-project";
import { cn } from "@/lib/utils";
import {
  Bot,
  CircleDollarSign,
  Cog,
  CreditCard,
  LayoutDashboard,
  Plus,
  Presentation,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {};

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Q&A",
    url: "/qa",
    icon: Bot,
  },
  {
    title: "Meetings",
    url: "/meetings",
    icon: Presentation,
  },
  {
    title: "Advanced",
    url: "/advanced",
    icon: Plus,
  },
  {
    title: "Billing",
    url: "/billing",
    icon: CreditCard,
  },
  {
    title: "Subscriptions",
    url: "/subscriptions",
    icon: CircleDollarSign, 
  },
  {
    title: "Settings",
    url: "/Settings",
    icon: Cog, 
  },
];


const AppSidebar = ({}: Props) => {
  const pathname = usePathname();

  const {projects, projectId, setProjectId} = useProject();

  const { open } = useSidebar();
  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <Link href={'/'}>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} />
            {open && (
              <h1 className="text-xl font-bold text-primary/80">Dionysus</h1>
            )}
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link
                        href={item.url}
                        className={cn({
                          "!bg-primary !text-white": pathname === item.url,
                        })}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects?.map((project) => {
                return (
                  <SidebarMenuItem key={project.name}>
                    <SidebarMenuButton asChild>
                        <div onClick={() => setProjectId(project.id)}>
                        <div
                          className={cn(
                          "cursor-pointer flex size-6 items-center justify-center rounded-sm border bg-white text-sm text-primary",
                          {
                            "bg-primary text-white cursor-pointer": project.id === projectId,
                            "px-2": !open, 
                          },
                          )}
                        >
                          {project.name[0]}
                        </div>
                        <span className="cursor-pointer">{project.name}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <div className="h-2"></div>

              {open && (
                <SidebarMenuItem>
                  <Link href="/create">
                    <Button size="sm" variant={"outline"} className="w-fit">
                      <Plus />
                      Create Project
                    </Button>
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
