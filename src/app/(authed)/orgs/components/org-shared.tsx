'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export type Role = 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER';
const ROLE_LABEL: Record<Role, string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

const ROLE_COLOR: Record<Role, string> = {
  ORG_OWNER: 'bg-blue-50 text-blue-700 border-blue-100',
  ORG_ADMIN: 'bg-green-50 text-green-700 border-green-100',
  ORG_MEMBER: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const getInitials = (name?: string | null) => (name ?? '').trim().slice(0, 2).toUpperCase();

const toDate = (v?: string | number | Date | null) => (v ? new Date(v) : null);

export const formatRelative = (v?: string | number | Date | null, label = 'Updated') => {
  const d = toDate(v);
  if (!d) return null;
  return `${label} ${formatDistanceToNow(d, { addSuffix: true })}`;
};

export const RoleBadge = ({ role }: { role?: Role | null }) => {
  if (!role) return null;
  return <Badge className={cn(ROLE_COLOR[role], 'w-fit shrink-0')}>{ROLE_LABEL[role]}</Badge>;
};

export const OrgAvatar = ({ name, logo }: { name: string; logo?: string | null }) => (
  <Avatar
    className={cn(
      'shrink-0 size-12 sm:size-14 rounded-xl',
      'group-hover:scale-105 transition-transform',
    )}
  >
    <AvatarImage src={logo ?? undefined} className='rounded-xl object-cover' />
    <AvatarFallback
      className={cn(
        'rounded-xl',
        'bg-linear-to-br from-primary to-primary/50',
        'text-primary-foreground',
      )}
    >
      {getInitials(name)}
    </AvatarFallback>
  </Avatar>
);

export const StatItem = ({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
}) => (
  <div className='flex items-center gap-2 text-xs sm:text-sm text-slate-600 w-full sm:w-auto'>
    <Icon className='w-4 h-4 shrink-0' />
    <span className='whitespace-nowrap'>
      {value} {label}
    </span>
  </div>
);
