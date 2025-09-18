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
import type { Role } from '@prisma/client';
import Link from 'next/link';

export const nav = [
  {
    title: 'Mes posters',
    url: '/dashboard/posters',
    icon: IconHome,
    onlyAdmin: false,
  },
  {
    title: 'Tous les posters',
    url: '/dashboard/all-posters',
    icon: IconFolder,
    onlyAdmin: true,
  },
  {
    title: 'Utilisateurs',
    url: '/dashboard/users',
    icon: IconUsers,
    onlyAdmin: true,
  },
];

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & {
  user: { name: string, role: Role }
}) {
  const allowedURL = React.useMemo(
    () => nav.filter((item) => !item.onlyAdmin || user.role === 'ADMIN'),
    [user.role],
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/">
                <Image src={Saturne} alt="Logo Saturne" className="!size-5" />
                <span className="text-base font-semibold">Saturne</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={allowedURL} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
