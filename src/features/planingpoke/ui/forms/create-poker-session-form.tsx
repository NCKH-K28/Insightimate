'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Settings2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  DeckTypeSelector,
  HostSelector,
  InviteTeamLink,
} from '../components';
import {
  ZPokerSessionCreateInput,
  type PokerHostCandidate,
  type PokerSessionCreateInput,
} from '../../types';

type CreatePokerSessionFormProps = {
  /** Người tạo session (mặc định là host) */
  creator: PokerHostCandidate;
  /** Thành viên team có thể được chọn làm host */
  candidates: PokerHostCandidate[];
  /** Đường link mời team join session */
  inviteUrl: string;
  /** Bật khi đã có integration tạo session ở backend */
  onSubmit?: (input: PokerSessionCreateInput) => Promise<void> | void;
  /** Mở dialog cấu hình nâng cao (timer, reveal mode, …) */
  onOpenAdvanced?: () => void;
};

export function CreatePokerSessionForm({
  creator,
  candidates,
  inviteUrl,
  onSubmit,
  onOpenAdvanced,
}: CreatePokerSessionFormProps) {
  const form = useForm<PokerSessionCreateInput>({
    resolver: zodResolver(ZPokerSessionCreateInput),
    mode: 'onChange',
    defaultValues: {
      name: '',
      deckType: 'FIBONACCI',
      hostMode: 'ME',
      hostUserId: undefined,
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!onSubmit) {
      // Tạm thời UI-only: hiển thị toast để feedback flow.
      toast.success('Room is ready to be created', {
        description: `Session "${data.name}" • Deck ${data.deckType}`,
      });
      return;
    }
    await onSubmit(data);
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className={cn(
          'w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl',
          'space-y-5',
        )}
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoFocus
                  placeholder='e.g., Sprint 42 Planning Poker'
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='deckType'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Select Deck Type</FormLabel>
              <FormControl>
                <DeckTypeSelector value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Who will manage tasks?</FormLabel>
          <HostSelector
            creator={creator}
            candidates={candidates}
            hostMode={form.watch('hostMode')}
            onHostModeChange={(m) => form.setValue('hostMode', m, { shouldValidate: true })}
            hostUserId={form.watch('hostUserId')}
            onHostUserChange={(id) =>
              form.setValue('hostUserId', id, { shouldValidate: true })
            }
          />
          {form.formState.errors.hostUserId && (
            <p className='text-xs text-destructive'>
              {form.formState.errors.hostUserId.message}
            </p>
          )}
        </FormItem>

        <InviteTeamLink inviteUrl={inviteUrl} />

        <div className='flex items-center gap-2 pt-1'>
          <Button
            type='submit'
            className='h-11 flex-1 text-base font-semibold'
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting && <Loader2 className='animate-spin' />}
            {form.formState.isSubmitting ? 'Creating…' : 'Create Room'}
          </Button>
          <Button
            type='button'
            variant='outline'
            size='icon'
            className='h-11 w-11'
            onClick={onOpenAdvanced}
            aria-label='Advanced settings'
          >
            <Settings2 className='size-4' />
          </Button>
        </div>
      </form>
    </Form>
  );
}
