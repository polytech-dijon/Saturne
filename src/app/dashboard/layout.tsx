import React, { ReactNode } from 'react';
import { auth } from '@/auth';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SiteHeader } from '@/components/SiteHeader';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 50)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={session.user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
