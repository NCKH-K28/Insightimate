'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CreatePokerSessionForm } from '@/features/planingpoke';
import type { PokerHostCandidate } from '@/features/planingpoke';
import { Bell, HelpCircle, Settings } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// TODO: thay bằng dữ liệu từ API (members của workspace) khi backend sẵn sàng.
const MOCK_CREATOR: PokerHostCandidate = {
  id: 'me',
  name: 'You (Creator)',
  email: 'you@architect.app',
};

const MOCK_TEAM: PokerHostCandidate[] = [
  { id: 'u1', name: 'Linh Nguyen', email: 'linh@team.app' },
  { id: 'u2', name: 'Huy Tran', email: 'huy@team.app' },
  { id: 'u3', name: 'Mai Pham', email: 'mai@team.app' },
  { id: 'u4', name: 'Khanh Le', email: 'khanh@team.app' },
  { id: 'u5', name: 'An Vu', email: 'an@team.app' },
];

export default function CreatePokerSessionLandingPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const workspaceId = params?.workspaceId ?? 'demo';

  const inviteUrl = `architect.app/join/${workspaceId}/sprint-42-ritual`;

  const handleCreate = async (data: { name: string }) => {
    const sessionId =
      data.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'new-session';
    router.push(`/wps/${workspaceId}/poker-sessions/${sessionId}/backlog`);
  };

  return (
    <div className='relative min-h-screen w-full overflow-hidden bg-[#F5F7FF]'>
      {/* Decorative shapes */}
      <div
        aria-hidden
        className='pointer-events-none absolute -right-32 top-12 h-[460px] w-[460px] rounded-full bg-primary/5 blur-3xl'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -bottom-20 -left-20 h-[280px] w-[280px] rounded-full bg-primary/5 blur-3xl'
      />

      {/* Top bar */}
      <header className='relative z-10 flex items-center justify-between bg-background/80 px-8 py-4 backdrop-blur'>
        <Link href='/' className='text-sm font-bold tracking-tight text-primary'>
          The Collaborative Architect
        </Link>

        <div className='flex items-center gap-3'>
          <button
            type='button'
            aria-label='Notifications'
            className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
          >
            <Bell className='size-4' />
          </button>
          <button
            type='button'
            aria-label='Settings'
            className='rounded-full p-2 text-muted-foreground hover:bg-accent/40 hover:text-foreground'
          >
            <Settings className='size-4' />
          </button>
          <Avatar className='size-8'>
            <AvatarFallback>YC</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Body */}
      <div className='relative z-10 container mx-auto grid grid-cols-1 items-center gap-10 px-6 pb-20 pt-12 lg:grid-cols-2'>
        {/* LEFT - Hero */}
        <section className='order-2 mx-auto max-w-md text-left lg:order-1'>
          <p className='text-xs font-bold uppercase tracking-[0.18em] text-primary'>
            New Session
          </p>
          <h1 className='mt-3 text-4xl font-extrabold leading-tight tracking-tight text-foreground md:text-5xl'>
            Architect Your <br />
            <span className='text-primary'>Sprint.</span>
          </h1>
          <p className='mt-4 text-sm leading-relaxed text-muted-foreground md:text-base'>
            Set the stage for a high-precision estimation ritual. Choose your methodology
            and invite your builders.
          </p>

          <div className='mt-6 flex items-center gap-3'>
            <div className='flex -space-x-2'>
              {MOCK_TEAM.slice(0, 3).map((m) => (
                <Avatar key={m.id} className='size-8 border-2 border-background'>
                  <AvatarImage src={m.avatarUrl} alt={m.name} />
                  <AvatarFallback className='text-[10px]'>
                    {m.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className='text-xs text-muted-foreground'>Team waiting…</span>
          </div>
        </section>

        {/* RIGHT - Form */}
        <section className='order-1 flex justify-center lg:order-2'>
          <CreatePokerSessionForm
            creator={MOCK_CREATOR}
            candidates={MOCK_TEAM}
            inviteUrl={inviteUrl}
            onSubmit={handleCreate}
          />
        </section>
      </div>

      {/* Step indicator */}
      <div className='relative z-10 flex items-center justify-center gap-2 pb-10'>
        <span className='h-1.5 w-6 rounded-full bg-muted-foreground/30' />
        <span className='h-1.5 w-6 rounded-full bg-muted-foreground/60' />
        <span className='h-1.5 w-6 rounded-full bg-muted-foreground/30' />
      </div>

      {/* Help button */}
      <button
        type='button'
        aria-label='Help'
        className='fixed bottom-6 right-6 z-20 flex size-10 items-center justify-center rounded-md bg-background shadow-md hover:bg-accent/40'
      >
        <HelpCircle className='size-4 text-muted-foreground' />
      </button>
    </div>
  );
}
