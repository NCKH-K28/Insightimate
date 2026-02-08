'use client';

import { UserPlus, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
      {icon && <div className='mb-4 text-muted-foreground'>{icon}</div>}
      <h3 className='text-lg font-semibold mb-2'>{title}</h3>
      <p className='text-sm text-muted-foreground mb-6 max-w-sm'>{description}</p>
      {action && (
        <Button onClick={action.onClick} size='sm'>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function MembersEmptyState({ onAddMember }: { onAddMember: () => void }) {
  return (
    <EmptyState
      icon={<UserPlus className='h-12 w-12' />}
      title='No members yet'
      description='Invite team members to collaborate on projects and manage your organization together.'
      action={{
        label: 'Invite Members',
        onClick: onAddMember,
      }}
    />
  );
}

export function InvitationsEmptyState() {
  return (
    <EmptyState
      icon={<Mail className='h-12 w-12' />}
      title='No pending invitations'
      description='When you invite new members, they will appear here until they accept or decline.'
    />
  );
}
