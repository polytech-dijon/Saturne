'use client';

import * as React from 'react';
import {
  IconFolder, IconHome,
  IconUsers,
} from '@tabler/icons-react';

import { NavMain } from '@/components/NavMain';
import { NavUser } from '@/components/NavUser';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Image from 'next/image';
import Saturne from '@/../public/saturne.png';
import { Role } from '@prisma/client';

const nav = [
  {
    title: 'Mes posters',
    url: '/dashboard/mes-posters',
    icon: IconHome,
  },
  {
    title: 'Tous les posters',
    url: '/dashboard/tous-les-posters',
    icon: IconFolder,
  },
  {
    title: 'Utilisateurs',
    url: '/dashboard/utilisateurs',
    icon: IconUsers,
  },
];

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & {
  user: { name: string, role: Role }
}) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <Image src={Saturne} alt="Logo Saturne" className="!size-5" />
                <span className="text-base font-semibold">Saturne</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
