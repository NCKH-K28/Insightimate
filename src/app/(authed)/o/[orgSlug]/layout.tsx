import { PropsWithChildren } from 'react';
import LayoutOrg from '@/layouts/layout-org';

export default async function Layout({ children }: PropsWithChildren) {
  return <LayoutOrg>{children}</LayoutOrg>;
}
