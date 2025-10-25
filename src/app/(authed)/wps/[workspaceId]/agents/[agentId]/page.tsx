'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import { useParams } from 'next/navigation';
import { SourcesPanel } from './_components/panels/sources-panel';
import { StudioPanel } from './_components/panels/studio-panel';
import { ChatPanel } from './_components/panels/chat-panel';

export default function Page() {
  const params = useParams<{ workspaceId: string; agentId: string }>();

  return (
    <div
      // [left panel] - [main content - w auto] - [right panel]
      className={cn('flex h-full w-full', 'grid-cols-[auto_1fr_auto]', 'gap-4', 'px-4 py-6')}
    >
      <SourcesPanel params={params} />
      <main className={cn('flex-1 overflow-auto')}>
        <ChatPanel params={params} />
      </main>
      <StudioPanel params={params} />
    </div>
  );
}
