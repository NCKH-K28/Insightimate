import React, { Suspense, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Pencil, X, Check, AlertCircle, Calendar, User, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getWorkspaceQueryOptions, updateWorkspaceMutationOptions } from '../../api/actions';

const WorkspaceInfoLoading = () => {
  return (
    <Card className='w-full max-w-2xl'>
      <CardHeader className='space-y-1'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-12 w-12 rounded-lg' />
          <div className='space-y-2'>
            <Skeleton className='h-6 w-48' />
            <Skeleton className='h-4 w-32' />
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='grid gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
        <Separator />
        <div className='flex items-center gap-4'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <div className='space-y-1'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-48' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className='flex items-center gap-3 text-sm'>
    <div className='flex items-center justify-center w-8 h-8 rounded-md bg-muted'>
      <Icon className='h-4 w-4 text-muted-foreground' />
    </div>
    <div className='flex flex-col'>
      <span className='text-xs text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value}</span>
    </div>
  </div>
);

export const WorkspaceInfo = ({ workspaceId }: { workspaceId: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const queryClient = useQueryClient();

  const {
    data: workspace,
    isLoading,
    isError,
    error,
  } = useQuery(getWorkspaceQueryOptions({ workspaceId }));

  const updateWorkspace = useMutation({
    ...updateWorkspaceMutationOptions({ workspaceId }),
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
    },
  });

  const handleStartEdit = () => {
    setEditedName(workspace?.name || '');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleSave = () => {
    if (editedName.trim() && editedName !== workspace?.name) {
      updateWorkspace.mutate({ name: editedName.trim() });
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return <WorkspaceInfoLoading />;
  }

  if (isError) {
    return (
      <Card className='w-full max-w-2xl border-destructive'>
        <CardContent className='pt-6'>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Failed to load workspace information. {error?.message || 'Please try again later. '}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!workspace) {
    return (
      <Card className='w-full max-w-2xl'>
        <CardContent className='pt-6'>
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>Workspace not found with ID: {workspaceId}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const canEdit = workspace.permissions?.update ?? false;

  return (
    <Card className='w-full transition-shadow hover:shadow-md'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary'>
              <Building2 className='h-6 w-6' />
            </div>
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <CardTitle className='text-xl'>Workspace Information</CardTitle>
                {workspace.removedAt && (
                  <Badge variant='destructive' className='text-xs'>
                    Deleted
                  </Badge>
                )}
              </div>
              <CardDescription>Manage and view workspace details</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Workspace Name Section */}
        <div className='space-y-2'>
          <Label htmlFor='workspace-name' className='text-sm font-medium flex items-center gap-2'>
            <Building2 className='h-4 w-4 text-muted-foreground' />
            Workspace Name
          </Label>

          {isEditing ? (
            <div className='flex items-center gap-2'>
              <Input
                id='workspace-name'
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Enter workspace name...'
                className='flex-1'
                autoFocus
                disabled={updateWorkspace.isPending}
              />
              <Button
                size='icon'
                variant='ghost'
                onClick={handleSave}
                disabled={updateWorkspace.isPending || !editedName.trim()}
                className='h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-50'
              >
                {updateWorkspace.isPending && <Loader2 className='h-3 w-3 animate-spin' />}
                {updateWorkspace.isPending || <Check className='h-3 w-3' />}
              </Button>
              <Button
                size='icon'
                variant='ghost'
                onClick={handleCancelEdit}
                disabled={updateWorkspace.isPending}
                className='h-10 w-10 text-red-600 hover:text-red-700 hover:bg-red-50'
              >
                <X className='h-4 w-4' />
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-2 group'>
              <div className='flex-1 px-3 py-2 bg-muted/50 rounded-md font-medium'>
                {workspace.name}
              </div>
              {canEdit && (
                <Button
                  size='icon'
                  variant='ghost'
                  onClick={handleStartEdit}
                  className={cn('h-10 w-10', 'hover:bg-primary/10 hover:text-primary')}
                >
                  <Pencil className='h-4 w-4' />
                </Button>
              )}
            </div>
          )}

          {updateWorkspace.isError && (
            <Alert variant='destructive' className='mt-2'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>Failed to update workspace. Please try again.</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Owner Section */}
        {workspace.owner && (
          <>
            <Separator />
            <div className='space-y-2'>
              <Label className='text-sm font-medium flex items-center'>
                <User className='h-4 w-4 text-muted-foreground' />
                Owner
              </Label>
              <div className='flex items-center gap-3'>
                <Avatar className='h-10 w-10 border-2 border-background shadow-sm'>
                  <AvatarImage
                    src={workspace.owner.avatar || undefined}
                    alt={workspace.owner.name}
                  />
                  <AvatarFallback className='bg-primary/10 text-primary font-medium'>
                    {getInitials(workspace.owner.name)}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium truncate'>{workspace.owner.name}</p>
                  {workspace.owner.email && (
                    <p className='text-sm text-muted-foreground truncate'>
                      {workspace.owner.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />
        {/* Metadata Section */}
        <div className='grid gap-4 sm:grid-cols-2'>
          <InfoRow icon={Calendar} label='Created' value={formatDate(workspace.createdAt)} />
          <InfoRow icon={Calendar} label='Last Updated' value={formatDate(workspace.updatedAt)} />
        </div>
      </CardContent>
    </Card>
  );
};

export const WorkspaceInfoWithSuspense = ({ workspaceId }: { workspaceId: string }) => {
  return (
    <Suspense fallback={<WorkspaceInfoLoading />}>
      <WorkspaceInfo workspaceId={workspaceId} />
    </Suspense>
  );
};
