'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import dynamic from 'next/dynamic';

const AgentPanel = dynamic(
  () => import('./_components/panels/agent-panel').then((mod) => mod.default),
  { ssr: false },
);

const SourcesPanel = dynamic(
  () => import('./_components/panels/sources-panel').then((mod) => mod.SourcesPanel),
  { ssr: false },
);

const StudioPanel = dynamic(
  () => import('./_components/panels/studio-panel').then((mod) => mod.StudioPanel),
  { ssr: false },
);

export default function Page({ children }: { children?: React.ReactNode }) {
  return (
    <div
      // [left panel] - [main content - w auto] - [right panel]
      className={cn('flex h-full w-full', 'grid-cols-[auto_1fr_auto]', 'gap-4', 'px-4 py-6')}
    >
      {/* <SourcesPanel /> */}
      <main className={cn('flex-1 overflow-auto')}>
        <AgentPanel />
      </main>
      {/* <StudioPanel /> */}
    </div>
  );
}
