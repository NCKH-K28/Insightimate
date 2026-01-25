'use client';

import { getOrgQueryOptions } from '@/features/organization/api/actions';
import { useParamsRequired } from '@/hooks/next-navigation';
import { useSuspenseQuery } from '@tanstack/react-query';

type Members = {
  userId: string;
  orgId: string;
  role: 'ORG_ADMIN' | 'ORG_MEMBER' | 'ORG_OWNER';
  user: { id: string; name: string; email: string; avatarURL?: string };
};

const mockMembers: Members[] = [
  {
    userId: 'user1',
    orgId: 'org1',
    role: 'ORG_OWNER',
    user: { id: 'user1', name: 'Alice Johnson', email: 'user1@example.com' },
  },
];

type OrgMembersListProps = {
  members: Members[];
  editable?: boolean;
  roleOptions?: Members['role'][];
  onRoleChange?: (userId: string, newRole: Members['role']) => void;
  onRemoveMember?: (userId: string) => void;
};

const ROLE_LABELS: Record<Members['role'], string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

const OrgMembersList = ({ members }: { members: Members[] }) => {
  return (
    <div>
      {members.map((member) => (
        <div key={member.userId} className='flex items-center justify-between p-2 border-b'>
          <div className='flex items-center gap-3'>
            <div className='h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-white'>
              {member.user.name.charAt(0)}
            </div>
            <div>
              <div className='font-medium'>{member.user.name}</div>
              <div className='text-sm text-muted-foreground'>{member.user.email}</div>
            </div>
          </div>
          <div className='text-sm text-muted-foreground'>{member.role.replace('ORG_', '')}</div>
        </div>
      ))}
    </div>
  );
};

export default function Page() {
  const { orgSlug } = useParamsRequired<{ orgSlug: string }>();

  const fetchOrg = useSuspenseQuery(getOrgQueryOptions({ id: orgSlug, by: 'slug' }));

  if (fetchOrg.isPending) return <div>Loading...</div>;
  if (fetchOrg.isError) return <div>Error loading organization.</div>;
  return (
    <div className='size-full flex flex-col gap-4'>
      <div className='h-12 px-4 flex items-center border-b'>
        <h1 className='text-sm text-muted-foreground'>Members Settings</h1>
      </div>
      <div className='px-4'>
        <div
        // search and filter can be added later
        ></div>
      </div>
    </div>
  );
}
