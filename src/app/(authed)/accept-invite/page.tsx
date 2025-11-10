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

  const info = useQuery({
    ...getInviteInfoQueryOptions(token || ''),
    enabled: token !== undefined && token.length > 0,
  });
  const acceptInvite = useMutation(acceptInviteMutionOptions(token));
  const rejectInvite = useMutation(rejectInviteMutionOptions(token));

  const handleAcceptInvite = async () => {
    toast
      .promise(acceptInvite.mutateAsync(token), {
        loading: 'Processing...',
        success: 'Invitation Accepted',
        error: 'Failed to Accept Invitation',
      })
      .unwrap()
      .then((data) => {
        router.push('/');
      });
  };

  const handleRejectInvite = async () => {
    toast
      .promise(rejectInvite.mutateAsync(token), {
        loading: 'Processing...',
        success: 'Invitation Declined',
        error: 'Failed to Decline Invitation',
      })
      .unwrap()
      .then((data) => {
        router.push('/');
      });
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

  if (!token || token.length === 0) {
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
  if (info.isPending) {
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
  if (info.isError || !info.data) {
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

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
            <Building2 className='h-6 w-6 text-primary' />
          </div>
          <CardTitle className='text-2xl'>Workspace Invitation</CardTitle>
          <CardDescription>You've been invited to join a workspace</CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Workspace Information */}
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
              <Building2 className='h-4 w-4' />
              Workspace
            </div>
            <div className='pl-6'>
              <p className='font-semibold text-lg'>{info.data.resource.name}</p>
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
                <AvatarImage
                  src={info.data.inviter.avatar || undefined}
                  alt={`${info.data.inviter.name}'s avatar`}
                />
                <AvatarFallback>{getInitials(info.data.inviter.name)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 min-w-0'>
                <p className='font-medium truncate'>{info.data.inviter.name || 'Unknown User'}</p>
                <p className='text-sm text-muted-foreground truncate'>{info.data.inviter.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Expiry Information */}
          {info.data.expiresAt && (
            <Alert>
              <Clock className='h-4 w-4' />
              <AlertDescription>{formatExpiryDate(info.data.expiresAt)}</AlertDescription>
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
              disabled={rejectInvite.isPending || acceptInvite.isPending}
            >
              {rejectInvite.isPending ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <XCircle className='mr-2 h-4 w-4' />
              )}
              Decline
            </Button>
            <Button
              onClick={handleAcceptInvite}
              className='flex-1'
              disabled={acceptInvite.isPending || rejectInvite.isPending}
            >
              {acceptInvite.isPending ? (
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
            disabled={acceptInvite.isPending || rejectInvite.isPending}
          >
            <Home className='mr-2 h-4 w-4' />
            Return Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
