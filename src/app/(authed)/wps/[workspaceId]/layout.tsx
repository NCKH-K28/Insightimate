import { PropsWithChildren } from 'react';
import WpsLayout from '@/layouts/layout-wps';

export default async function Layout({ children }: PropsWithChildren) {
  return <WpsLayout>{children}</WpsLayout>;
}
