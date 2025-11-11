'use client';

import { useParams } from 'next/navigation';
import { AgentsList } from '@/features/agents/ui/components/agents-list';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Page() {
  const params = useParams<{ workspaceId: string }>();
  if (!params) throw new Error('Missing params');

  return <AgentsList params={params} />;
}
