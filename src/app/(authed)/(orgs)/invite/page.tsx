'use client';

import { useSearchParamsRequired } from '@/hooks/next-navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, Mail, Shield, Clock, UserPlus } from 'lucide-react';

type OrgRole = 'ORG_OWNER' | 'ORG_ADMIN' | 'ORG_MEMBER';

interface InvitationData {
  organization: {
    id: string;
    name: string;
    logoURL?: string | null;
  };
  invitation: {
    email: string;
    role: OrgRole;
    expiresAt: string;
  };
  inviter: {
    id: string;
    name: string | null;
    email: string;
  };
}

const ROLE_LABELS: Record<OrgRole, string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

const ROLE_DESCRIPTIONS: Record<OrgRole, string> = {
  ORG_OWNER: 'Full control over the organization',
  ORG_ADMIN: 'Manage members and settings',
  ORG_MEMBER: 'Collaborate on projects',
};

function LoadingSkeleton() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <Skeleton className='h-8 w-3/4 mb-2' />
          <Skeleton className='h-4 w-1/2' />
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='space-y-3'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-full' />
          </div>
          <Separator />
          <div className='space-y-4'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-3/4' />
            <Skeleton className='h-4 w-2/3' />
          </div>
        </CardContent>
        <CardFooter className='flex gap-3'>
          <Skeleton className='h-10 flex-1' />
          <Skeleton className='h-10 flex-1' />
        </CardFooter>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-2xl'>
        <CardContent className='pt-6'>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Invalid Invitation Link</AlertTitle>
            <AlertDescription>
              This invitation link is missing required information. Please check the link and try
              again, or contact the person who invited you.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <Card className='w-full max-w-2xl'>
        <CardContent className='pt-6'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertTitle>Unable to Load Invitation</AlertTitle>
            <AlertDescription className='mt-2'>
              {error.message || 'Failed to fetch invitation details. Please try again.'}
            </AlertDescription>
          </Alert>
          {onRetry && (
            <div className='mt-4'>
              <Button onClick={onRetry} variant='outline' className='w-full'>
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  const router = useRouter();
  const query = useSearchParamsRequired();
  const token = query.get('token') ?? undefined;

  const tokenQueryString = React.useMemo(
    () => new URLSearchParams(token ? { token } : {}).toString(),
    [token],
  );

  const fetchData = useQuery({
    queryKey: ['org-invite', token],
    queryFn: async () => {
      const path = `/api/v3/me/orgs/invite`;
      const url = token ? `${path}?${tokenQueryString}` : path;
      const res = await fetch(url);
      if (!res.ok) {
        let msg = 'Failed to fetch invite info';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return res.json() as Promise<InvitationData>;
    },
    enabled: !!token,
    retry: false,
  });

  const orgId = fetchData.data?.organization.id;

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('Organization ID not found');
      const path = `/api/v3/me/orgs/${orgId}/invite/accept`;
      const res = await fetch(`${path}?${tokenQueryString}`, {
        method: 'POST',
      });
      if (!res.ok) {
        let msg = 'Failed to accept invite';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invitation accepted!', {
        description: 'Redirecting to organization...',
      });
      if (orgId) {
        setTimeout(() => router.replace(`/o/${orgId}`), 1000);
      }
    },
    onError: (error) => {
      toast.error('Failed to accept invitation', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('Organization ID not found');
      const res = await fetch(`/api/v3/me/orgs/${orgId}/invite/reject?${tokenQueryString}`, {
        method: 'POST',
      });
      if (!res.ok) {
        let msg = 'Failed to reject invite';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Invitation declined', {
        description: 'Redirecting...',
      });
      setTimeout(() => router.replace('/orgs'), 1000);
    },
    onError: (error) => {
      toast.error('Failed to decline invitation', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });

  const handleAccept = () => {
    if (!token) return;
    acceptMutation.mutate();
  };

  const handleReject = () => {
    if (!token) return;
    rejectMutation.mutate();
  };

  // UI State Logic following react-ui-patterns
  if (!token) return <EmptyState />;
  if (fetchData.isError)
    return <ErrorState error={fetchData.error} onRetry={() => fetchData.refetch()} />;
  if (fetchData.isLoading && !fetchData.data) return <LoadingSkeleton />;
  if (!fetchData.data) return <EmptyState />;

  const { organization, invitation, inviter } = fetchData.data;
  const busy = acceptMutation.isPending || rejectMutation.isPending;
  const expiresAt = new Date(invitation.expiresAt);
  const isExpired = expiresAt < new Date();

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-muted/30'>
      <Card className='w-full max-w-2xl'>
        <CardHeader>
          <div className='flex items-start gap-4'>
            <div className='shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center'>
              <UserPlus className='h-6 w-6 text-primary' />
            </div>
            <div className='flex-1'>
              <CardTitle className='text-2xl'>You're Invited!</CardTitle>
              <CardDescription className='mt-1'>
                Join <span className='font-semibold text-foreground'>{organization.name}</span> as a
                team member
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Invitation Details */}
          <div className='space-y-4'>
            <div className='flex items-center gap-3 text-sm'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-muted-foreground'>Invited email</p>
                <p className='font-medium'>{invitation.email}</p>
              </div>
            </div>

            <div className='flex items-center gap-3 text-sm'>
              <Shield className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-muted-foreground'>Role</p>
                <div className='flex items-center gap-2 mt-1'>
                  <Badge variant='secondary'>{ROLE_LABELS[invitation.role]}</Badge>
                  <span className='text-xs text-muted-foreground'>
                    {ROLE_DESCRIPTIONS[invitation.role]}
                  </span>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-3 text-sm'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <div>
                <p className='text-muted-foreground'>Expires</p>
                <p className={`font-medium ${isExpired ? 'text-destructive' : ''}`}>
                  {expiresAt.toLocaleDateString()} at {expiresAt.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inviter Info */}
          <div className='text-sm'>
            <p className='text-muted-foreground mb-1'>Invited by</p>
            <p className='font-medium'>
              {inviter.name || inviter.email}
              {inviter.name && (
                <span className='text-muted-foreground ml-2'>({inviter.email})</span>
              )}
            </p>
          </div>

          {/* Expired Warning */}
          {isExpired && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Invitation Expired</AlertTitle>
              <AlertDescription>
                This invitation has expired. Please contact {inviter.name || inviter.email} to send
                a new invitation.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className='flex gap-3'>
          <Button
            onClick={handleAccept}
            disabled={busy || isExpired}
            className='flex-1'
            aria-label='Accept invitation to join organization'
            aria-busy={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4 animate-spin' />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle2 className='mr-2 h-4 w-4' />
                Accept Invitation
              </>
            )}
          </Button>
          <Button
            onClick={handleReject}
            disabled={busy || isExpired}
            variant='outline'
            className='flex-1'
            aria-label='Decline invitation'
            aria-busy={rejectMutation.isPending}
          >
            {rejectMutation.isPending ? 'Declining...' : 'Decline'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
