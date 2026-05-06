'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_NAV = [
  {
    category: 'Your Profile',
    items: [
      { label: 'General', href: '/user/settings', icon: User },
      { label: 'Preferences', href: '/user/settings/preferences', icon: Sliders },
    ],
  },
  {
    category: 'Security',
    items: [
      { label: 'Change Password', href: '/user/settings/security', icon: Shield },
    ],
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className='container mx-auto py-6'>
      <h1 className='text-2xl font-bold mb-6'>Settings</h1>

      <div className='flex flex-col md:flex-row gap-8'>
        {/* Sidebar */}
        <aside className='w-full md:w-56 shrink-0'>
          <nav className='space-y-6'>
            {SETTINGS_NAV.map((group) => (
              <div key={group.category}>
                <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-3'>
                  {group.category}
                </h3>
                <ul className='space-y-1'>
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-muted text-foreground'
                              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                          )}
                        >
                          <Icon className='h-4 w-4' />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className='flex-1 min-w-0'>{children}</main>
      </div>
    </div>
  );
}
