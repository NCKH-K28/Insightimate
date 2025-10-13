'use client';

import { selectedWorkspaceIdAtom } from '@/hooks/atoms/workspace.atom';
import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Page() {
  const router = useRouter();

  const [selectedWorkspaceId] = useAtom(selectedWorkspaceIdAtom);

  useEffect(() => {
    if (selectedWorkspaceId) {
      router.replace(`/wps/${selectedWorkspaceId}`);
    } else {
      router.replace('/wps');
    }
  }, [router, selectedWorkspaceId]);

  return null;
}
