'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getOrgQueryOptions } from '@/features/organization/api/actions';
import { useParamsRequired } from '@/hooks/next-navigation';
import { useSuspenseQuery } from '@tanstack/react-query';
import React from 'react';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, XIcon } from 'lucide-react';
import { OrgMembersList } from '../../_components/org-members-list';
import { OrgInviteesList } from '../../_components/org-invitees-list';
import { useForm } from 'react-hook-form';
import z from 'zod';

type Member = {
  userId: string;
  orgId: string;
  role: 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_OWNER';
  user: { id: string; name: string; email: string; avatarURL?: string };
};

const ROLE_LABELS: Record<Member['role'], string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

export const ZAddMembersInput = z.object({
  invitees: z.array(
    z.object({ email: z.string().email(), role: z.enum(['ORG_ADMIN', 'ORG_MEMBER']) }),
  ),
});

type Invitee = { email: string; role: Member['role'] };
type AddMemberDialogProps = {
  isOpen?: boolean;
  onClose?: () => void;
  roleOptions?: Member['role'][];
  onSend?: (invs: Invitee[]) => void;
  params: { orgId: string };
};

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({
  isOpen,
  onClose,
  roleOptions,
  onSend,
}) => {
  const [invs, setInvs] = React.useState<Invitee[]>([]);

  const form = useForm({ defaultValues: { invitees: [] as Invitee[] } });

  const handleAdd = () => {
    const validInvs = invs.filter((inv) => inv.email.trim() !== '');
    onSend?.(validInvs);
    setInvs([]);
    onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>Invite a new member to your organization.</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          {invs.map((inv, idx) => (
            <div key={idx} className='flex gap-2'>
              <Input
                type='email'
                placeholder='Email'
                value={inv.email}
                onChange={(e) => {
                  const newInvs = [...invs];
                  newInvs[idx].email = e.target.value;
                  setInvs(newInvs);
                }}
                className='flex-1'
              />
              <Select
                value={inv.role}
                onValueChange={(value) => {
                  setInvs((prevInvs) => {
                    const newInvs = [...prevInvs];
                    newInvs[idx].role = value as Member['role'];
                    return newInvs;
                  });
                }}
              >
                <SelectTrigger className='w-[150px]'>
                  <SelectValue placeholder='Select role' />
                </SelectTrigger>
                {roleOptions && (
                  <SelectContent>
                    {roleOptions.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                )}
              </Select>
              <Button
                variant='outline'
                onClick={() => setInvs((prev) => prev.filter((_, i) => i !== idx))}
              >
                <XIcon />
              </Button>
            </div>
          ))}
          <Button
            variant='link'
            onClick={() => {
              if (roleOptions && roleOptions.length > 0) {
                setInvs([...invs, { email: '', role: roleOptions[0] }]);
              }
            }}
          >
            <PlusIcon /> Add Another Invitee
          </Button>
        </div>
        <DialogFooter>
          <Button variant='secondary' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Send Invites</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Page() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();
  const fetchOrg = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);

  const roleOptions = React.useMemo(() => {
    const perm = fetchOrg.data?._me?.perms;
    const options: Member['role'][] = [];
    if (perm?.includes('members:manage#admin')) options.push('ORG_ADMIN');
    if (perm?.includes('members:manage#member')) options.push('ORG_MEMBER');
    return options;
  }, [fetchOrg.data?._me?.perms]);

  if (fetchOrg.isPending) return <div>Loading...</div>;
  if (fetchOrg.isError) return <div>Error loading organization.</div>;
  return (
    <div className='size-full flex flex-col gap-4'>
      <AddMemberDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        roleOptions={roleOptions}
        params={{ orgId: fetchOrg.data.id }}
      />

      <div className='h-12 px-4 flex items-center border-b'>
        <h1 className='text-sm text-muted-foreground'>Members Settings</h1>
      </div>
      <div className='px-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-semibold'>Members</h2>
            <Badge>{0} Members</Badge>
          </div>
          <div className='flex gap-2 justify-end'>
            <Button onClick={() => setIsAddDialogOpen(true)}>Add Member</Button>
          </div>
        </div>
        <div className='pt-4'>
          <OrgMembersList
            members={[
              {
                userId: 'user1',
                orgId: 'org1',
                role: 'ORG_OWNER',
                user: { id: 'user1', name: 'Alice Johnson', email: 'user1@example.com' },
              },
            ]}
            roleOptions={roleOptions}
          />
          <OrgInviteesList invitees={[{ email: 'user1@example.com', role: 'ORG_MEMBER' }]} />
        </div>
      </div>
    </div>
  );
}
