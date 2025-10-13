'use client';

import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, UserPlus, MoreVertical, Shield, User, Eye, Crown } from 'lucide-react';
import debounce from 'lodash/debounce';
import { toast } from 'sonner';
import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import {
  addProjectMemberMutationOptions,
  listProjectMembersQueryOptions,
} from '@/features/projects/api/actions';

import { getMeQueryOptions } from '@/features/authn/api/actions'; // FIXME: move to a more appropriate place
import { userApi } from '@/features/users/api/http';
import { UserPublic } from '@/contracts/users';

type PageContainerProps = { params: { projectId: string; workspaceId: string } };
export function PageContainer({ params }: PageContainerProps) {
  const { projectId } = params;

  const { data: me } = useSuspenseQuery(getMeQueryOptions());
  const { data: members } = useSuspenseQuery(listProjectMembersQueryOptions({ projectId }));

  const addMember = useMutation(addProjectMemberMutationOptions({ projectId }));

  const [searchResults, setSearchResults] = useState<UserPublic[]>([]);
  const searchUser = React.useCallback((txt?: string | null) => {
    if (!txt) return;
    if (txt.trim() === '') return;
    return userApi.search({}, { search: txt });
  }, []);
  const debouncedSearchUser = useMemo(() => debounce(searchUser, 300), [searchUser]);

  const searchWithSet = React.useCallback(
    (txt?: string | null) => {
      if (!txt) return;
      if (txt.trim() === '') {
        setSearchResults([]);
        return;
      }
      const deb = debouncedSearchUser(txt);
      if (deb) {
        deb.then((data) => {
          setSearchResults(data);
        });
      }
    },
    [debouncedSearchUser, setSearchResults],
  );

  const handleInviteMember = React.useCallback(
    (userId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER') => {
      toast.promise(
        addMember.mutateAsync({
          projectRole: role,
          roleType: 'USER',
          roleParam: userId,
        }),
        {
          loading: 'Inviting member...',
          success: (data) => {
            setSearchResults([]);
            return `Member ${data.user.name} invited successfully!`;
          },
          error: (error) => `Failed to invite member: ${error.message}`,
        },
      );
    },
    [addMember],
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className='h-4 w-4' />;
      case 'MEMBER':
        return <User className='h-4 w-4' />;
      case 'VIEWER':
        return <Eye className='h-4 w-4' />;
      default:
        return <User className='h-4 w-4' />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'MEMBER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const memberStats = {
    total: members.length,
    admins: members.filter((m) => m.role === 'ADMIN').length,
    members: members.filter((m) => m.role === 'MEMBER').length,
    viewers: members.filter((m) => m.role === 'VIEWER').length,
  };

  const permissions = [
    { key: 'MEMBER_ADD', granted: true },
    { key: 'MEMBER_DROP', granted: true },
    { key: 'MEMBER_EDIT', granted: true },
  ];

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [role, setRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(({ user }) => {
    const email = user.email || '';
    return (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const { canInviteMember, canDeleteMember, canUpdateMemberRole } = useMemo(() => {
    if (!permissions)
      return { canInviteMember: false, canDeleteMember: false, canUpdateMemberRole: false };

    const canInviteMember = Boolean(
      permissions.find((p) => {
        return p.key === 'MEMBER_ADD' && p.granted === true;
      }),
    );
    const canDeleteMember = Boolean(
      permissions.find((p) => {
        return p.key === 'MEMBER_DROP' && p.granted === true;
      }),
    );
    const canUpdateMemberRole = Boolean(
      permissions.find((p) => {
        return p.key === 'MEMBER_EDIT' && p.granted === true;
      }),
    );
    return { canInviteMember, canDeleteMember, canUpdateMemberRole };
  }, [permissions]);

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Project Members</h1>
          <p className='text-muted-foreground'>Manage your project team and permissions</p>
        </div>
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button className='gap-2'>
              <UserPlus className='h-4 w-4' />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Add a new member to your project team with specific permissions.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Role</label>
                <Select
                  value={role}
                  onValueChange={(value: 'ADMIN' | 'MEMBER' | 'VIEWER') => setRole(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select a role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      <SelectItem value='ADMIN'>
                        <div className='flex items-center gap-2'>
                          <Crown className='h-4 w-4' />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value='MEMBER'>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4' />
                          Member
                        </div>
                      </SelectItem>
                      <SelectItem value='VIEWER'>
                        <div className='flex items-center gap-2'>
                          <Eye className='h-4 w-4' />
                          Viewer
                        </div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='text-sm font-medium'>Search User</label>
                <Input
                  placeholder='Search by name or email'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    searchWithSet(e.target.value);
                  }}
                />
                {searchResults.length > 0 && (
                  <div className='mt-2 space-y-2'>
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => {
                          handleInviteMember(user.id, role);
                        }}
                      >
                        <p>
                          {user.name} ({user.email})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* <UserSelectionForm
                onSelect={(user) => {
                  inviteMember.mutate({ inviteeId: user.id, role });
                  setIsInviteDialogOpen(false);
                }}
              /> */}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Members</CardTitle>
            <Shield className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{memberStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Admins</CardTitle>
            <Crown className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{memberStats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Members</CardTitle>
            <User className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{memberStats.members}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Viewers</CardTitle>
            <Eye className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{memberStats.viewers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
            <CardTitle>Team Members</CardTitle>
            <div className='relative w-full sm:w-72'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4' />
              <Input
                placeholder='Search members...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='all' className='w-full'>
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='all'>All ({memberStats.total})</TabsTrigger>
              <TabsTrigger value='admin'>Admins ({memberStats.admins})</TabsTrigger>
              <TabsTrigger value='member'>Members ({memberStats.members})</TabsTrigger>
              <TabsTrigger value='viewer'>Viewers ({memberStats.viewers})</TabsTrigger>
            </TabsList>

            <TabsContent value='all' className='mt-6'>
              <div className='space-y-3'>
                {filteredMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors'
                  >
                    <div className='flex items-center space-x-4'>
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${member.user.email}`} />
                        <AvatarFallback>{member.user.name[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className='font-semibold'>
                          {member.user.name}
                          {member.user.id === me?.id ? ' (You)' : ''}
                        </h4>
                        <p className='text-sm text-muted-foreground'>{member.user.email}</p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-3'>
                      <Badge variant='secondary' className={`gap-1 ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            disabled={
                              member.user.id === me?.id ||
                              [canInviteMember, canDeleteMember, canUpdateMemberRole].filter(
                                Boolean,
                              ).length === 0
                            }
                            variant='ghost'
                            size='sm'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem disabled={!canUpdateMemberRole}>
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={!canDeleteMember}
                            className='text-destructive'
                          >
                            Drop Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Similar TabsContent for other tabs with filtered data */}
            <TabsContent value='admin' className='mt-6'>
              <div className='space-y-3'>
                {filteredMembers
                  .filter((m) => m.role === 'ADMIN')
                  .map((member, idx) => (
                    // Same member card structure
                    <div key={idx} className='p-4 text-center text-muted-foreground'>
                      Admin members will be displayed here
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value='member' className='mt-6'>
              <div className='space-y-3'>
                {filteredMembers
                  .filter((m) => m.role === 'MEMBER')
                  .map((member, idx) => (
                    // Same member card structure
                    <div key={idx} className='p-4 text-center text-muted-foreground'>
                      Team members will be displayed here
                    </div>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value='viewer' className='mt-6'>
              <div className='space-y-3'>
                {filteredMembers
                  .filter((m) => m.role === 'VIEWER')
                  .map((member, idx) => (
                    // Same member card structure
                    <div key={idx} className='p-4 text-center text-muted-foreground'>
                      Viewer members will be displayed here
                    </div>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
