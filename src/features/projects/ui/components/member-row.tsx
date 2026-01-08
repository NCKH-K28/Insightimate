'use client';

import * as React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Mail,
  Users,
  User2,
  Loader2,
  MoreVertical,
  MailIcon,
  NotebookIcon,
  DeleteIcon,
} from 'lucide-react';

// ===== Types =====
export type MemberRowProps = {
  actor: {
    id: string;
    name: string;
    email?: string | null;
    avatar?: string | null;
    description?: string | null;
  };
  member: {
    actorId: string;
    actorType: 'USER' | 'TEAM';
    roleId: string;
    role: { id: string; name: string };
  };
  me?: { id: string } | null;
  teamsPath: string; // e.g. '/teams'
  roles?: Array<{ id: string; name: string }>;
  isRolesPending?: boolean;
  refetchRoles: () => void | Promise<void>;
  onChangeRole?: (roleId: string) => void | Promise<void>;
  canEditRole?: boolean; // default: true
  onRemove?: () => void | Promise<void>; // optional quick action
};

// ===== Component =====
export default function MemberRow({
  actor,
  member,
  me,
  teamsPath,
  roles = [],
  isRolesPending,
  refetchRoles,
  onChangeRole,
  canEditRole = true,
  onRemove,
}: MemberRowProps) {
  const isYou = actor?.id && me?.id && actor.id === me.id;
  const actorInitial = (actor?.name?.[0] || '?').toUpperCase();

  const [updating, setUpdating] = React.useState(false);

  async function handleChangeRole(nextRoleId: string) {
    if (!onChangeRole || nextRoleId === member.roleId) return;
    setUpdating(true);
    try {
      await onChangeRole(nextRoleId);
    } finally {
      setUpdating(false);
    }
  }

  const Right = (
    <div className='flex items-end gap-2'>
      {/* Role selector */}
      <div className='flex flex-col items-start'>
        <span className='text-[10px] uppercase tracking-wide text-muted-foreground'>Role</span>
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div>
                <Select
                  value={member.roleId}
                  onValueChange={handleChangeRole}
                  disabled={!canEditRole || isRolesPending || updating}
                >
                  <SelectTrigger
                    className='w-[200px] h-9'
                    onClick={(e) => {
                      e.stopPropagation();
                      refetchRoles();
                    }}
                    aria-label='Change project role'
                  >
                    {isRolesPending || updating ? (
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Loader2 className='size-4 animate-spin' />
                        <span>{updating ? 'Updating…' : 'Loading roles…'}</span>
                      </div>
                    ) : (
                      <SelectValue placeholder='Select a role'>
                        {member.role?.name || 'Unknown role'}
                      </SelectValue>
                    )}
                  </SelectTrigger>
                  <SelectContent align='end' className='max-h-64'>
                    <SelectGroup>
                      <SelectLabel>Project Role</SelectLabel>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id} className='cursor-pointer'>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>
              Change {actor.name.split(' ')[0]}&apos;s role
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Row actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' className='h-9 w-9'>
            <MoreVertical className='size-4' />
            <span className='sr-only'>Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-44'>
          <DropdownMenuLabel className='text-xs'>Actions</DropdownMenuLabel>
          <DropdownMenuGroup>
            {onRemove && (
              <DropdownMenuItem onClick={() => onRemove?.()} variant='destructive'>
                <DeleteIcon className='size-4 mr-2' />
                Remove Member
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div
      className={
        'group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border bg-card/50 p-3 sm:p-4 transition-all hover:bg-accent/30 focus-within:ring-2 focus-within:ring-ring'
      }
      role='listitem'
    >
      {/* Left: identity */}
      <div className='flex min-w-0 items-start gap-3'>
        <div className='relative'>
          <Avatar className='size-11 ring-1 ring-border'>
            <AvatarImage src={actor?.avatar ?? undefined} alt={actor?.name ?? 'Avatar'} />
            <AvatarFallback>{actorInitial}</AvatarFallback>
          </Avatar>
        </div>

        <div className='flex min-w-0 flex-col'>
          {/* Name + type badge */}
          <div className='flex flex-wrap items-center gap-2'>
            {member.actorType === 'USER' ? (
              <span className='font-semibold truncate max-w-[18rem]'>{actor?.name}</span>
            ) : (
              <Link
                href={`${teamsPath}/${member.actorId}`}
                className='font-semibold hover:underline truncate max-w-[18rem]'
                prefetch={false}
              >
                {actor?.name}
              </Link>
            )}

            <Badge
              variant={member.actorType === 'USER' ? 'outline' : 'secondary'}
              className='gap-1'
            >
              {member.actorType === 'USER' ? (
                <User2 className='size-3.5' />
              ) : (
                <Users className='size-3.5' />
              )}
              <span className='uppercase text-[10px] tracking-wide'>
                {member.actorType.toLowerCase()}
              </span>
            </Badge>

            {isYou && (
              <Badge variant='secondary' className='h-5 text-[11px]'>
                You
              </Badge>
            )}
          </div>

          {/* Meta: email / link */}
          <div className='mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground'>
            {member.actorType === 'USER' && actor?.email ? (
              <Link
                prefetch={false}
                href={`mailto:${actor.email}`}
                className='inline-flex items-center gap-1 hover:underline truncate max-w-[20rem]'
              >
                <Mail className='size-3.5' />
                <span className='truncate'>{actor.email}</span>
              </Link>
            ) : (
              <span className='inline-flex items-center gap-1 truncate max-w-[20rem]'>
                {member.actorType === 'TEAM' ? (
                  <NotebookIcon className='size-3.5' />
                ) : (
                  <MailIcon className='size-3.5' />
                )}
                <span className='truncate'>
                  {actor?.description || actor?.email || 'No description'}
                </span>
              </span>
            )}
          </div>

          {/* Divider (mobile only) */}
          <Separator className='my-3 sm:hidden' />
        </div>
      </div>

      {/* Right: role + actions */}
      {Right}
    </div>
  );
}
