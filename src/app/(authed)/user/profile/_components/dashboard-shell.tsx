import React from 'react';
import {
  Bell,
  Search,
  Menu,
  Home,
  Briefcase,
  Users,
  Settings,
  FileText,
  Layout as LayoutIcon,
  ChevronRight,
  Mail,
  Moon,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className='min-h-screen bg-background flex'>
      {/* Desktop Sidebar */}
      <aside className='hidden lg:flex w-64 flex-col border-r bg-card/50'>
        <div className='h-16 flex items-center px-6 border-b font-bold text-lg'>
          Shadcn Dashboard
        </div>
        <div className='flex-1 py-4 flex flex-col gap-1 px-3'>
          <div className='px-3 py-2 text-xs font-semibold text-muted-foreground uppercase'>
            Main
          </div>
          <SidebarItem icon={<Home size={18} />} label='Ecommerce' hasSub />
          <SidebarItem icon={<Briefcase size={18} />} label='CRM' hasSub />
          <SidebarItem icon={<Globe size={18} />} label='Social Network' active hasSub />
          <div className='ml-4 pl-4 border-l my-1 flex flex-col gap-1'>
            <Button
              variant='ghost'
              className='w-full justify-start h-8 text-sm bg-accent text-accent-foreground'
            >
              Profile
            </Button>
            <Button variant='ghost' className='w-full justify-start h-8 text-sm'>
              Settings
            </Button>
          </div>
          <SidebarItem icon={<LayoutIcon size={18} />} label='Kanban Board' />
          <SidebarItem icon={<FileText size={18} />} label='Forms' hasSub />
        </div>
        <div className='p-4 border-t'>
          <Button className='w-full' variant='default'>
            Download Dashboard
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col min-w-0'>
        {/* Top Navbar */}
        <header className='h-16 border-b bg-card/50 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 backdrop-blur-sm'>
          <div className='flex items-center gap-4'>
            {/* Mobile Sidebar Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant='ghost' size='icon' className='lg:hidden'>
                  <Menu className='h-5 w-5' />
                </Button>
              </SheetTrigger>
              <SheetContent side='left' className='w-64 p-0'>
                <div className='h-16 flex items-center px-6 border-b font-bold text-lg'>
                  Shadcn Dashboard
                </div>
                {/* Simplified Mobile Nav content */}
                <div className='p-4'>Navigation Placeholder</div>
              </SheetContent>
            </Sheet>

            {/* Breadcrumbs */}
            <nav className='hidden md:flex items-center text-sm text-muted-foreground'>
              <Home className='h-4 w-4 mr-2' />
              <span className='mx-2'>Home</span>
              <ChevronRight className='h-4 w-4' />
              <span className='mx-2 font-medium text-foreground'>User</span>
            </nav>
          </div>

          <div className='flex-1 max-w-md mx-4 hidden md:block relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input placeholder='Search...' className='pl-9 bg-background/50' />
            <div className='absolute right-2 top-2 text-[10px] bg-muted px-1.5 py-0.5 rounded border text-muted-foreground font-mono'>
              ⌘K
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button variant='ghost' size='icon' className='text-muted-foreground relative'>
              <Mail className='h-5 w-5' />
              <span className='absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background'></span>
            </Button>
            <Button variant='ghost' size='icon' className='text-muted-foreground relative'>
              <Bell className='h-5 w-5' />
              <span className='absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-background'></span>
            </Button>
            <Avatar className='h-8 w-8 ml-2 cursor-pointer'>
              <AvatarImage src='https://github.com/shadcn.png' />
              <AvatarFallback>EL</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page Content */}
        <main className='flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50/50 dark:bg-zinc-950'>
          <div className='max-w-6xl mx-auto space-y-6'>{children}</div>
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  hasSub,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  hasSub?: boolean;
  active?: boolean;
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      className='w-full justify-between h-9 px-3 font-normal'
    >
      <div className='flex items-center gap-3'>
        <span className='text-muted-foreground'>{icon}</span>
        <span>{label}</span>
      </div>
      {hasSub && <ChevronRight className='h-4 w-4 text-muted-foreground/50' />}
    </Button>
  );
}
