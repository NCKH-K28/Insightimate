'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useParams, usePathname } from 'next/navigation';
import {
  Home,
  FolderKanban,
  Calendar,
  BarChart3,
  Settings,
  X,
  Star,
  GalleryVerticalEnd,
  HomeIcon,
  Users2Icon,
  BotIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { useQuery } from '@tanstack/react-query';
import WorkspaceSwitcher from './workspace-switcher';
import NavUser from './nav-user';

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  // const fetchRecentPlans = useQuery({
  //   ...fetchPlansQueryOption(),
  //   select: (data) => data.slice(0, 3),
  // });

  const fetchRecentPlans = useQuery({
    queryKey: ['plans', 'recent', workspaceId],
    queryFn: async () => {
      return [] as any[];
    },
  });

  const recentPlans = fetchRecentPlans.data;

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/foryou`}>
                <HomeIcon />
                <span>For You</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/agents`}>
                <BotIcon />
                <span>Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/settings`}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/reports`}>
                <BarChart3 />
                <span>Reports</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/starred`}>
                <Star />
                <span>Starred</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/wps/${workspaceId}/teams`}>
                <Users2Icon />
                <span>Teams</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          label='Recent'
          items={[
            {
              title: 'Plans',
              url: `/wps/${workspaceId}/plans`,
              icon: Calendar,
              items: recentPlans?.map((plan) => ({
                title: plan.title,
                url: `/wps/${workspaceId}/plans/${plan.id}`,
              })),
            },
            {
              title: 'Projects',
              url: `/wps/${workspaceId}/projects`,
              icon: FolderKanban,
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
