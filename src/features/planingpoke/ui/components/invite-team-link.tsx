'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

type InviteTeamLinkProps = {
  inviteUrl: string;
  className?: string;
};

export function InviteTeamLink({ inviteUrl, className }: InviteTeamLinkProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard có thể bị chặn (insecure context). Bỏ qua silent.
    }
  }, [inviteUrl]);

  return (
    <div className={cn('rounded-md border bg-muted/30 p-3', className)}>
      <div className='mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground'>
        <Users className='size-3.5' />
        Invite team
      </div>
      <div className='flex items-center gap-2'>
        <Input readOnly value={inviteUrl} className='h-9 bg-background font-mono text-xs' />
        <Button
          type='button'
          size='sm'
          onClick={handleCopy}
          className={cn(
            'h-9 shrink-0 gap-1.5',
            copied && 'bg-emerald-600 hover:bg-emerald-600',
          )}
        >
          {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
          {copied ? 'Copied' : 'Copy Link'}
        </Button>
      </div>
    </div>
  );
}
