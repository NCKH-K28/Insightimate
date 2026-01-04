'use client';

import React, { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { redirect, useParams } from 'next/navigation';
import {
  FolderKanban,
  Calendar,
  BarChart3,
  Settings,
  Star,
  HomeIcon,
  Users2Icon,
  BotIcon,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { NavMain } from './nav-main';
import { useQuery } from '@tanstack/react-query';
import NavUser from './nav-user';
import { OrgItem } from '@/contracts/organizations/organization.query';
import OrgSwitcher from './org-switcher';
import { Separator } from '@/components/ui/separator';
import axiosInstance from '@/lib/api/_client';

type AppLeftbarProps = React.ComponentProps<typeof Sidebar> & { org: OrgItem };
const AppLeftbar: React.FC<AppLeftbarProps> = (props) => {
  const params = useParams<{ orgSlug: string }>();
  if (!params) throw new Error('Params is undefined');
  const { orgSlug } = params;

  const fetchOrgs = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const path = `/v3/orgs`;
      const res = await axiosInstance.get<{ data: OrgItem[] }>(path);
      return res.data.data;
    },
    initialData: [],
    enabled: false,
  });

  const fetchRecentPlans = useQuery({
    queryKey: ['plans', 'recent', orgSlug],
    queryFn: async () => {
      return [] as any[];
    },
  });

  const recentPlans = fetchRecentPlans.data;

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <OrgSwitcher
          org={props.org}
          onSelect={(org) => redirect(`/o/${org.slug}`)}
          fetchOrgs={async () => {
            const { data: orgs } = await fetchOrgs.refetch();
            return orgs ?? [];
          }}
        />

        <Separator />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/foryou`}>
                <HomeIcon />
                <span>For You</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/agents`}>
                <BotIcon />
                <span>Agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/settings`}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/teams`}>
                <Users2Icon />
                <span>Teams</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem className='opacity-50 pointer-events-none'>
            <SidebarMenuButton asChild disabled={true}>
              <Link href={`/o/${orgSlug}/reports`}>
                <BarChart3 />
                <span>Reports</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href={`/o/${orgSlug}/starred`}>
                <Star />
                <span>Starred</span>
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
              title: 'Projects',
              url: `/o/${orgSlug}/projects`,
              icon: FolderKanban,
            },
            {
              title: 'Plans',
              url: `/o/${orgSlug}/plans`,
              icon: Calendar,
              disabled: true,
              items: recentPlans?.map((plan) => ({
                title: plan.title,
                url: `/o/${orgSlug}/plans/${plan.id}`,
              })),
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
};

// function AppLeftbar({ ...props }: AppLeftbarProps) {
//   const params = useParams<{ workspaceId: string }>();
//   if (!params) throw new Error('Params is undefined');
//   const { workspaceId } = params;

//   const fetchRecentPlans = useQuery({
//     queryKey: ['plans', 'recent', workspaceId],
//     queryFn: async () => {
//       return [] as any[];
//     },
//   });

//   const recentPlans = fetchRecentPlans.data;

//   return (
//     <Sidebar collapsible='icon' {...props}>
//       <SidebarHeader>
//         <WorkspaceSwitcher />

//         <SidebarMenu>
//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <Link href={`/wps/${workspaceId}/foryou`}>
//                 <HomeIcon />
//                 <span>For You</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>

//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <Link href={`/wps/${workspaceId}/agents`}>
//                 <BotIcon />
//                 <span>Agents</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>

//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <Link href={`/wps/${workspaceId}/settings`}>
//                 <Settings />
//                 <span>Settings</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>

//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <Link href={`/wps/${workspaceId}/teams`}>
//                 <Users2Icon />
//                 <span>Teams</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>

//           <SidebarMenuItem className='opacity-50 pointer-events-none'>
//             <SidebarMenuButton asChild disabled={true}>
//               <Link href={`/wps/${workspaceId}/reports`}>
//                 <BarChart3 />
//                 <span>Reports</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>

//           <SidebarMenuItem>
//             <SidebarMenuButton asChild>
//               <Link href={`/wps/${workspaceId}/starred`}>
//                 <Star />
//                 <span>Starred</span>
//               </Link>
//             </SidebarMenuButton>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>
//       <SidebarContent>
//         <NavMain
//           label='Recent'
//           items={[
//             {
//               title: 'Projects',
//               url: `/wps/${workspaceId}/projects`,
//               icon: FolderKanban,
//             },
//             {
//               title: 'Plans',
//               url: `/wps/${workspaceId}/plans`,
//               icon: Calendar,
//               disabled: true,
//               items: recentPlans?.map((plan) => ({
//                 title: plan.title,
//                 url: `/wps/${workspaceId}/plans/${plan.id}`,
//               })),
//             },
//           ]}
//         />
//       </SidebarContent>
//       <SidebarFooter>
//         <NavUser />
//       </SidebarFooter>
//       <SidebarRail />
//     </Sidebar>
//   );
// }

export default AppLeftbar;
