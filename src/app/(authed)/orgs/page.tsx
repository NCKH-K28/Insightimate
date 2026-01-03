'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ChevronDown,
  ChevronUp,
  FolderIcon,
  Loader2,
  PlusIcon,
  User2Icon,
  Users2Icon,
} from 'lucide-react';
import { Suspense, useState } from 'react';

import { OrgInvitationItem, OrgItem } from '@/contracts/organizations/organization.query';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouterRequired } from '@/hooks/next-navigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreateOrgForm, CreateOrgFormData } from './components/create-org-form';
import { Separator } from '@/components/ui/separator';
import { presignUpload } from '@/lib/api/upload-api';
import { orgAPI } from '@/features/organization/api/http';
import axiosInstance from '@/lib/api/_client';

const OrgListSkeleton = () => (
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
    {Array.from({ length: 3 }).map((_, idx) => (
      <Card key={idx} className='animate-pulse'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Skeleton className='shrink-0 size-12 sm:size-14 rounded-xl' />
            <div className='min-w-0 flex-1'>
              <Skeleton className='h-5 w-3/4 mb-2 rounded' />
              <Skeleton className='h-4 w-1/2 rounded' />
            </div>
          </CardTitle>
        </CardHeader>
        <CardFooter className='flex flex-wrap items-center gap-5 border-t border-slate-200'>
          <Skeleton className='h-4 w-1/4 rounded' />
          <Skeleton className='h-4 w-1/4 rounded' />
          <Skeleton className='h-4 w-1/4 rounded' />
        </CardFooter>
      </Card>
    ))}
  </div>
);

enum Role {
  ORG_OWNER = 'ORG_OWNER',
  ORG_ADMIN = 'ORG_ADMIN',
  ORG_MEMBER = 'ORG_MEMBER',
}

const ROLE_LABEL = {
  [Role.ORG_OWNER]: 'Owner',
  [Role.ORG_ADMIN]: 'Admin',
  [Role.ORG_MEMBER]: 'Member',
};

const ROLE_COLOR = {
  [Role.ORG_OWNER]: 'bg-blue-50 text-blue-700 border-blue-100',
  [Role.ORG_ADMIN]: 'bg-green-50 text-green-700 border-green-100',
  [Role.ORG_MEMBER]: 'bg-slate-100 text-slate-600 border-slate-200',
};

type InvitationRowProps = {
  invite: OrgInvitationItem;
  props?: React.HTMLAttributes<HTMLDivElement>;
  isProcessing?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
};
export const InvitationRow: React.FC<InvitationRowProps> = ({
  invite,
  onAccept,
  onReject,
  isProcessing,
}) => {
  const org = invite.organization;
  const role = invite.role;

  const formatName = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <Card>
      <CardContent className='flex flex-row justify-between'>
        <div className='flex items-center gap-4 w-full md:w-auto'>
          <Avatar
            className={cn(
              'shrink-0 size-12 sm:size-14 rounded-xl',
              'group-hover:scale-105 transition-transform',
            )}
          >
            <AvatarImage src={org.logo ?? undefined} className='rounded-xl object-cover' />
            <AvatarFallback
              className={cn(
                'rounded-xl',
                'bg-linear-to-br from-primary to-primary/50',
                'text-primary-foreground',
              )}
            >
              {formatName(org.name)}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2'>
              <h3
                className={cn(
                  'min-w-0 font-semibold text-slate-800 text-base sm:text-lg leading-snug line-clamp-2 sm:line-clamp-1',
                  'group-hover:text-primary',
                )}
              >
                {org.name}
              </h3>

              {role && (
                <Badge className={`${ROLE_COLOR[role]} w-fit shrink-0`}>{ROLE_LABEL[role]}</Badge>
              )}
            </div>
            {org.createdAt && (
              <p className='text-xs text-slate-500'>
                {`Invited ${formatDistanceToNow(org.createdAt)}`}
              </p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-4 w-full md:w-auto justify-between md:justify-end'>
          <div className='flex items-center gap-3'>
            <Button onClick={onAccept} disabled={isProcessing}>
              {isProcessing && <Loader2 className='animate-spin' />}
              {isProcessing ? 'Joining...' : 'Accept'}
            </Button>
            <Button onClick={onReject} disabled={isProcessing} variant='outline'>
              {isProcessing && <Loader2 className='animate-spin' />}
              {isProcessing ? 'Rejecting...' : 'Reject'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

type InvitationsSectionProps = { className?: string };
export const InvitationsSection: React.FC<InvitationsSectionProps> = () => {
  const [collapsed, setCollapsed] = useState(true);
  const fetchInvites = useQuery({
    queryKey: ['orgs', 'invites'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: OrgInvitationItem[]; meta: { total: number } }>(
        '/v3/me/invites',
      );
      return res.data.data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (i: { inviteId: string; action: 'accept' | 'reject' }) => {
      console.log(i);
    },
  });

  if (fetchInvites.isPending) return null;
  if (fetchInvites.isError) return null;
  if (fetchInvites.data.length === 0) return null;
  return (
    <section className='animate-fade-in max-h-lg overflow-y-auto'>
      <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)}>
        <div className='flex items-center justify-between mb-4 border-b border-slate-200 pb-2'>
          <h2 className='text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2'>
            Pending invitations
            <span className='bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full'>
              {fetchInvites.data.length}
            </span>
          </h2>
          <CollapsibleTrigger asChild>
            <Button variant='ghost' size='icon'>
              {collapsed ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className='max-h-lg overflow-y-auto'>
          <CollapsibleContent className='grid gap-3'>
            {fetchInvites.data.map((invite) => (
              <InvitationRow
                key={invite.id}
                invite={invite}
                onAccept={() => inviteMutation.mutate({ inviteId: invite.id, action: 'accept' })}
                onReject={() => inviteMutation.mutate({ inviteId: invite.id, action: 'reject' })}
              />
            ))}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </section>
  );
};

type OrgCardProps = { org: OrgItem; href?: string };
export const OrgCard: React.FC<OrgCardProps> = ({ org, href }) => {
  const router = useRouterRequired();
  const count = org._count;

  const role = org._me?.role;
  const formatName = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <Card
      className={cn(
        'transition-all',
        href ? 'group cursor-pointer hover:shadow-lg hover:border-primary' : '',
      )}
      onClick={() => href && router.push(href)}
      role={href ? 'button' : undefined}
      tabIndex={href ? 0 : undefined}
    >
      <CardHeader>
        <CardTitle className='flex items-start gap-3'>
          <Avatar
            className={cn(
              'shrink-0 size-12 sm:size-14 rounded-xl',
              'group-hover:scale-105 transition-transform',
            )}
          >
            <AvatarImage src={org.logo ?? undefined} className='rounded-xl object-cover' />
            <AvatarFallback
              className={cn(
                'rounded-xl',
                'bg-linear-to-br from-primary to-primary/50',
                'text-primary-foreground',
              )}
            >
              {formatName(org.name)}
            </AvatarFallback>
          </Avatar>

          <div className='min-w-0 flex-1'>
            <div className='flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2'>
              <h3
                className={cn(
                  'min-w-0 font-semibold text-slate-800 text-base sm:text-lg leading-snug line-clamp-2 sm:line-clamp-1',
                  'group-hover:text-primary',
                )}
              >
                {org.name}
              </h3>

              {role && (
                <Badge className={`${ROLE_COLOR[role]} w-fit shrink-0`}>{ROLE_LABEL[role]}</Badge>
              )}
            </div>
            {org.updatedAt && (
              <p className='text-xs text-slate-500'>
                {`Updated ${formatDistanceToNow(org.updatedAt)}`}
              </p>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {count && (
        <CardFooter className='flex flex-wrap items-center gap-5 border-t border-slate-200'>
          {count.projects && (
            <div className='flex items-center gap-2 text-xs sm:text-sm text-slate-600 w-full sm:w-auto'>
              <FolderIcon className='w-4 h-4 shrink-0' />
              <span className='whitespace-nowrap'>{count.projects} Projects</span>
            </div>
          )}

          {count.members && (
            <div className='flex items-center gap-2 text-xs sm:text-sm text-slate-600 w-full sm:w-auto'>
              <User2Icon className='w-4 h-4 shrink-0' />
              <span className='whitespace-nowrap'>{count.members} Members</span>
            </div>
          )}

          {count.teams && (
            <div className='flex items-center gap-2 text-xs sm:text-sm text-slate-600 w-full sm:w-auto'>
              <Users2Icon className='w-4 h-4 shrink-0' />
              <span className='whitespace-nowrap'>{count.teams} Teams</span>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export const OrgList = () => {
  const { data: orgs } = useSuspenseQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: OrgItem[]; meta: { total: number } }>('/v3/orgs');
      return res.data.data;
    },
  });

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
      {orgs.map((org) => (
        <OrgCard key={org.id} org={org} href={`/o/${org.slug}`} />
      ))}
    </div>
  );
};

type OrgListPageHeaderProps = { onCreateOrgBtnClick?: () => void };
export const OrgListPageHeader: React.FC<OrgListPageHeaderProps> = ({ onCreateOrgBtnClick }) => {
  return (
    <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
      <div>
        <h1 className='text-3xl font-bold text-slate-800'>Your Organizations</h1>
        <p className='text-slate-500 mt-1 text-sm'>
          Manage your teams, projects, and billing across all organizations.
        </p>
      </div>
      <div className='flex items-center gap-2'>
        <Button onClick={onCreateOrgBtnClick}>
          <PlusIcon className='w-4 h-4' />
          Create Organization
        </Button>
      </div>
    </div>
  );
};

export default function Page() {
  const [createOrgDialogOpen, setcreateOrgDialogOpen] = useState(false);

  const handleCreateOrg = async (data: CreateOrgFormData) => {
    let logoURL: string | null = null;
    if (data.logo instanceof File) {
      const logoFile = data.logo;
      const { uploadURL, assetKey } = await presignUpload({
        kind: 'org-logo',
        fileName: logoFile.name,
        fileSize: logoFile.size,
        fileType: logoFile.type,
      });
      const headers = { 'Content-Type': logoFile.type };
      await fetch(uploadURL, { method: 'PUT', headers, body: logoFile });
      logoURL = assetKey;
    } else {
      logoURL = data.logo;
    }

    return await orgAPI.create({ ...data, logo: logoURL });
  };

  const createMutation = useMutation({
    mutationFn: handleCreateOrg,
    onSuccess: (newOrg) => {
      window.location.href = `/o/${newOrg.slug}`;
    },
  });

  return (
    <div className='p-8 max-w-7xl mx-auto h-full overflow-y-auto flex flex-col gap-6'>
      <Dialog open={createOrgDialogOpen} onOpenChange={setcreateOrgDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
            <DialogDescription>Organization creation form goes here.</DialogDescription>
          </DialogHeader>
          <Separator />
          <CreateOrgForm
            onCancel={() => setcreateOrgDialogOpen(false)}
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <OrgListPageHeader onCreateOrgBtnClick={() => setcreateOrgDialogOpen(true)} />
      <InvitationsSection />
      <Suspense fallback={<OrgListSkeleton />}>
        <OrgList />
      </Suspense>
    </div>
  );
}
