'use client';

import * as React from 'react';
import { CheckIcon, PlusIcon, XIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogTrigger } from '@radix-ui/react-dialog';
import debounce from 'lodash/debounce';
import { useQuery } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserPublic } from '@/contracts/user';
import { searchUsersQueryOptions } from '@/features/user/api/actions';

export type UserInviteProps = {
  roleOptions?: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  dialogTitle?: string;
  dialogDescription?: string;
  onInviteClick?: (data: { users: UserPublic[]; role?: string }) => void | Promise<void>;
  onSelectChange?: (users: UserPublic[]) => void;
  excludeIds?: string[];
  params: { resourceType: 'WORKSPACE' | 'TEAM' | 'PROJECT'; resourceId: string };

  renderTrigger?: (props: { open: boolean; setOpen: (open: boolean) => void }) => React.ReactNode;
};

export const UserInvite = (props: UserInviteProps) => {
  // const excludeIdSet = React.useMemo(() => new Set(props.excludeIds ?? []), [props.excludeIds]);

  const {
    dialogTitle = 'Invite users',
    dialogDescription = 'Add users to your workspace',
    onInviteClick,
    roleOptions = [],
  } = props;

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [role, setRole] = React.useState<string | undefined>(() => {
    if (roleOptions.length > 0) return roleOptions[0].value;
    return undefined;
  });

  const setSearchDebounced = React.useMemo(() => debounce(setSearch, 300), [setSearch]);

  const { data: users, isPending } = useQuery(searchUsersQueryOptions(search, props.params as any));

  const [selectedUsers, setSelectedUsers] = React.useState<UserPublic[]>([]);

  const triggerRendered = props.renderTrigger ? props.renderTrigger({ open, setOpen }) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerRendered ?? (
          <Button variant='outline' size='sm' className='shadow-none' disabled={props.disabled}>
            <PlusIcon />
            Invite
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className='gap-0 p-0 outline-none'>
        <DialogHeader className='px-4 pt-5 pb-4'>
          {dialogTitle ? <DialogTitle>{dialogTitle}</DialogTitle> : null}
          {dialogDescription ? <DialogDescription>{dialogDescription}</DialogDescription> : null}

          {roleOptions.length > 0 && (
            <Select value={role} onValueChange={(value) => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Role</SelectLabel>
                  {roleOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </DialogHeader>
        <Command className='overflow-hidden rounded-t-none border-t bg-transparent'>
          <CommandInput
            autoFocus
            placeholder='Search user...'
            onValueChange={(text) => {
              setSearchDebounced(text);
            }}
          />
          <CommandList>
            <CommandEmpty>
              {search.trim().length === 0
                ? 'Type to search users'
                : isPending
                  ? 'Loading users...'
                  : 'No users found.'}
            </CommandEmpty>
            <CommandGroup>
              {users?.map((user: UserPublic) => (
                <CommandItem
                  key={user.email}
                  value={`${user.name} (${user.email})`}
                  data-active={selectedUsers.find((u) => u.id === user.id) != null}
                  className='data-[active=true]:opacity-50'
                  onSelect={() => {
                    setSelectedUsers((prev) => {
                      if (prev.find((u) => u.id === user.id) != null) {
                        return prev.filter((u) => u.id !== user.id);
                      } else return [...prev, user];
                    });
                  }}
                >
                  <Avatar className='border'>
                    <AvatarImage src={user.avatar ?? undefined} alt='Image' />
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className='ml-2'>
                    <p className='text-sm leading-none font-medium'>{user.name}</p>
                    <p className='text-muted-foreground text-sm'>{user.email}</p>
                  </div>
                  {selectedUsers.find((u) => u.id === user.id) != null ? (
                    <CheckIcon className='text-primary ml-auto flex size-4' />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <DialogFooter className='flex items-center border-t p-4 sm:justify-between'>
          {selectedUsers.length > 0 ? (
            <div className='flex -space-x-2 overflow-hidden'>
              {selectedUsers.map((user) => (
                <Tooltip key={user.id}>
                  <TooltipTrigger asChild>
                    <Avatar key={user.email} className='relative inline-block border'>
                      <AvatarImage src={user.avatar ?? undefined} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                      <XIcon
                        className='absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 text-white cursor-pointer m-auto rounded-full p-1'
                        onClick={() => {
                          setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
                        }}
                      />
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='max-w-xs'>{user.name}</p>
                    <p className='text-muted-foreground text-sm'>{user.email}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ) : (
            <p className='text-muted-foreground text-sm'>Select users to add to this thread.</p>
          )}

          <Button
            disabled={selectedUsers.length < 1}
            size='sm'
            onClick={() => {
              onInviteClick?.({ users: selectedUsers, role });
              setSelectedUsers([]);
              setOpen(false);
            }}
          >
            Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
