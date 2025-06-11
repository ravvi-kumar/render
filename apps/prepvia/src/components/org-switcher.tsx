'use client';

import * as React from 'react';
import logo from '../../public/PREPVIA_Logo Electric Cyan.png';
import small_logo from '../../public/PREPVIA_icon  Electric Cyan.png'

import {
  DropdownMenu,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import Image from 'next/image';

export function OrgSwitcher() {
  const { state } = useSidebar();
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              {state == 'collapsed' ? (
                <Image
                  src={small_logo}
                  alt='logo-img'
                  className='mt-2 w-full h-full'
                />
              ) : (
                <Image src={logo} alt='logo-img' width={180} />
              )}
              <div className='text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
