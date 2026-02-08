'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Loader2,
  User,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  AlertCircle,
} from 'lucide-react';

import {
  acceptInviteMutionOptions,
  getInviteInfoQueryOptions,
  rejectInviteMutionOptions,
} from '@/features/authz/api/actions';
import {
  acceptOrgInvitationMutationOptions,
  getOrgInvitationPreviewQueryOptions,
} from '@/features/organization/api/actions';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function InvitePage() {
  const searchParams = useSearchParams();
  if (!searchParams) throw new Error('Search params are not available');
  const router = useRouter();

  const token = searchParams.get('token') || undefined;
  const isTokenPresent = token !== undefined && token.length > 0;

  // Workspace Invite
  const wsInfo = useQuery({
    ...getInviteInfoQueryOptions(token || ''),
    enabled: isTokenPresent,
    retry: false,
  });

  // Org Invite
  const orgInfo = useQuery({
    ...getOrgInvitationPreviewQueryOptions(token || ''),
    enabled: isTokenPresent,
    retry: false,
  });

  const acceptWsInvite = useMutation(acceptInviteMutionOptions(token));
  const rejectWsInvite = useMutation(rejectInviteMutionOptions(token));

  const acceptOrgInvite = useMutation({
    ...acceptOrgInvitationMutationOptions(),
    onSuccess: ({ orgId }) => {
      toast.success('Invitation Accepted');
      router.push(`/o/${orgId}/settings`); // Redirect to org settings or dashboard
    },
    onError: () => toast.error('Failed to Accept Invitation'),
  });

  // Determine which type of invite we have
  const isWs = wsInfo.isSuccess && wsInfo.data;
  const isOrg = orgInfo.isSuccess && orgInfo.data;

  const isLoading =
    (wsInfo.isPending && orgInfo.isPending) ||
    (wsInfo.isPending && !isOrg) ||
    (orgInfo.isPending && !isWs);
  // Detailed loading logic:
  // If one succeeds, we are good.
  // If both fail, we are error.
  // If one fails and other pending, wait.

  const effectiveLoading = isLoading && !isWs && !isOrg;
  const isError =
    !isWs &&
    !isOrg &&
    !effectiveLoading &&
    (wsInfo.isError || wsInfo.data === null) &&
    (orgInfo.isError || orgInfo.data === null);

  const handleAcceptInvite = async () => {
    if (isWs) {
      toast
        .promise(acceptWsInvite.mutateAsync(token), {
          loading: 'Processing...',
          success: 'Invitation Accepted',
          error: 'Failed to Accept Invitation',
        })
        .unwrap()
        .then(() => router.push('/'));
    } else if (isOrg) {
      acceptOrgInvite.mutate(token!);
    }
  };

  const handleRejectInvite = async () => {
    if (isWs) {
      toast
        .promise(rejectWsInvite.mutateAsync(token), {
          loading: 'Processing...',
          success: 'Invitation Declined',
          error: 'Failed to Decline Invitation',
        })
        .unwrap()
        .then(() => router.push('/'));
    } else {
      // Org decline not implemented in UI yet
      toast.error('Declining organization invites is not supported yet.');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatExpiryDate = (date: Date | string) => {
    const now = new Date();
    const expiry = new Date(date);
    const diffInHours = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Expires soon';
    } else if (diffInHours < 24) {
      return `Expires in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Expires in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
    }
  };

  if (!isTokenPresent) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center'>
              <AlertCircle className='h-6 w-6 text-destructive' />
            </div>
            <CardTitle className='text-destructive'>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} variant='outline' className='w-full'>
              <Home className='mr-2 h-4 w-4' />
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Loading state
  if (effectiveLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex flex-col items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center'>
              <AlertCircle className='h-6 w-6 text-destructive' />
            </div>
            <CardTitle className='text-destructive'>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been used.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/')} variant='outline' className='w-full'>
              <Home className='mr-2 h-4 w-4' />
              Go Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Data prep
  const inviteData = isWs ? wsInfo.data! : orgInfo.data!;
  // Normalize fields
  const resourceName = isWs
    ? (inviteData as any).resource?.name
    : (inviteData as any).organization?.name;
  const inviterName = inviteData.inviter?.name || 'Unknown';
  const inviterEmail = inviteData.inviter?.email || '';
  const inviterAvatar = inviteData.inviter?.avatar;
  const expiry = inviteData.expiresAt;
  const title = isWs ? 'Workspace Invitation' : 'Organization Invitation';

  const isPending =
    acceptWsInvite.isPending || rejectWsInvite.isPending || acceptOrgInvite.isPending;

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
            <Building2 className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-2xl'>{title}</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join {isWs ? 'a workspace' : 'an organization'}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Resource Information */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <Building2 className='h-4 w-4' />
              {isWs ? 'Workspace' : 'Organization'}
            </div>
            <div className='pl-6'>
              <p className='font-semibold text-lg'>{resourceName}</p>
            </div>
          </div>

          <Separator />

          {/* Inviter Information */}
          <div className='space-y-3'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <User className='h-4 w-4' />
              Invited by
            </div>
            <div className='pl-6 flex items-center gap-3'>
              <Avatar className='h-10 w-10'>
                <AvatarImage src={inviterAvatar || undefined} alt={`${inviterName}'s avatar`} />
                <AvatarFallback>{getInitials(inviterName)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0'>
                <p className='font-medium truncate'>{inviterName}</p>
                <p className='text-sm text-muted-foreground truncate'>{inviterEmail}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Expiry Information */}
          {expiry && (
            <Alert>
              <Clock className='h-4 w-4' />
              <AlertDescription>{formatExpiryDate(expiry)}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className='flex flex-col gap-3'>
          {/* Action Buttons */}
          <div className='flex w-full gap-3'>
            <Button
              onClick={handleRejectInvite}
              variant='outline'
              className='flex-1'
              disabled={isPending || (isOrg && true) /* disable reject for org for now */}
            >
              <XCircle className='mr-2 h-4 w-4' />
              Decline
            </Button>
            <Button onClick={handleAcceptInvite} className='flex-1' disabled={isPending}>
              {isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <CheckCircle className='mr-2 h-4 w-4' />
              )}
              Accept
            </Button>
          </div>

          {/* Secondary Action */}
          <Button
            onClick={() => router.push('/')}
            variant='ghost'
            size='sm'
            className='w-full'
            disabled={isPending}
          >
            <Home className='mr-2 h-4 w-4' />
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
