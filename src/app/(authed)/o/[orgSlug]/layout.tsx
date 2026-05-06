import { PropsWithChildren } from 'react';
import LayoutOrg from '@/layouts/layout-org';
import { TrackLastOrg } from './_components/track-last-org';

type LayoutProps = PropsWithChildren<{
  params: Promise<{ orgSlug: string }>;
}>;

export default async function Layout({ children, params }: LayoutProps) {
  const { orgSlug } = await params;
  return (
    <LayoutOrg>
      <TrackLastOrg orgSlug={orgSlug} />
      {children}
    </LayoutOrg>
  );
}
