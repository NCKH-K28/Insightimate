import React, { useMemo, useTransition } from 'react';
import { ChevronsUpDown, GalleryVerticalEnd, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type OrgItem = {
  id: string;
  name: string;
  logo: string | null;
  slug: string;
  _me?: { role: 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER' };
};

type OrgSwitcherProps = {
  org?: OrgItem;
  fetchOrgs?: () => Promise<OrgItem[]>;
  fetchMode?: 'hover' | 'click';
  onAddOrg?: () => void;
  onSelect?: (org: OrgItem) => void;
  isMobile?: boolean;
};

const ROLE_LABELS: Record<'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER', string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

const OrgSwitcher: React.FC<OrgSwitcherProps> = ({
  org,
  fetchOrgs,
  fetchMode = 'click',
  onAddOrg,
  onSelect,
  isMobile,
}) => {
  const [isFetching, fetchingTransition] = useTransition();
  const [orgs, setOrgs] = React.useState<OrgItem[] | null>(null);

  const hanledFetchOrgs = () => {
    if (isFetching || orgs) return;
    if (fetchOrgs) fetchingTransition(async () => fetchOrgs().then(setOrgs));
  };

  const logoElm = useMemo(() => {
    if (!org) return <Skeleton className='h-8 w-8 rounded-md' />;
    const fallbackName = org.name.toUpperCase().slice(0, 2);
    const role = org._me?.role;

    return (
      <div className='w-full flex items-center overflow-hidden'>
        <Avatar className='size-10 rounded-md'>
          <AvatarImage src={org.logo ?? undefined} alt={org.name} className='rounded-md' />
          <AvatarFallback className='rounded-md'>{fallbackName}</AvatarFallback>
        </Avatar>
        <div className='ml-2 grid gap-1 flex-1 text-left text-sm leading-tight'>
          <span className='truncate font-medium'>{org.name}</span>
          {role && <Badge variant='secondary'>{ROLE_LABELS[role]}</Badge>}
        </div>
      </div>
    );
  }, [org]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        onPointerDown={fetchMode === 'click' ? hanledFetchOrgs : undefined}
        onMouseEnter={fetchMode === 'hover' ? hanledFetchOrgs : undefined}
      >
        <div className='w-full flex items-center flex-row'>
          {logoElm}
          <Button
            variant='ghost'
            size='icon'
            type='button'
            className='ml-auto data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          >
            <ChevronsUpDown className='size-4' />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
        align='start'
        side={isMobile ? 'bottom' : 'right'}
        sideOffset={4}
      >
        <DropdownMenuLabel className='text-muted-foreground text-xs'>
          Organizations
        </DropdownMenuLabel>
        {isFetching && !orgs ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className='p-2'>
              <Skeleton className='h-8 w-full rounded-md' />
            </div>
          ))
        ) : orgs && orgs.length > 0 ? (
          orgs.map((o) => {
            const fallbackName = o.name.toUpperCase().slice(0, 2);
            const role = o._me?.role;

            return (
              <DropdownMenuItem
                key={o.id}
                className='gap-2 p-2'
                onClick={() => onSelect && onSelect(o)}
              >
                <Avatar className='size-6 rounded-md'>
                  <AvatarImage src={o.logo ?? undefined} alt={o.name} className='rounded-md' />
                  <AvatarFallback className='rounded-md'>{fallbackName}</AvatarFallback>
                </Avatar>
                <div className='flex flex-1 flex-col text-left'>
                  <span className='font-medium'>{o.name}</span>
                  {role && (
                    <Badge variant='secondary' className='text-xs'>
                      {ROLE_LABELS[role]}
                    </Badge>
                  )}
                </div>
                <DropdownMenuShortcut>
                  <GalleryVerticalEnd className='size-4 text-muted-foreground' />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className='p-2 text-sm text-muted-foreground'>No organizations found.</div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className='gap-2 p-2' onClick={() => onAddOrg && onAddOrg()}>
          <div className='flex size-6 items-center justify-center rounded-md border bg-transparent'>
            <Plus className='size-4' />
          </div>
          <div className='text-muted-foreground font-medium'>Add organization</div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default OrgSwitcher;
