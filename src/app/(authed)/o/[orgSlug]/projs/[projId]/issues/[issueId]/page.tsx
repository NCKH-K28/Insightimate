import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import IssueDetailRoot from '@/features/boards/ui/containers/issue-detail/issue-detail-root';

type PageProps = {
  params: Promise<{ orgSlug: string; projId: string; issueId: string }>;
};

export default async function IssueDetailPage({ params }: PageProps) {
  const { orgSlug, projId, issueId } = await params;

  if (!orgSlug || !projId || !issueId) {
    notFound();
  }

  return (
    <Suspense>
      <IssueDetailRoot
        params={{ orgSlug, projId, issueId }}
      />
    </Suspense>
  );
}
