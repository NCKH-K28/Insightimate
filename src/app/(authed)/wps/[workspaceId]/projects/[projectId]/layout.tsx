import React, { PropsWithChildren } from 'react';
import ProjectLayout from '@/layouts/layout-project';

export default async function Layout({ children }: PropsWithChildren) {
  return <ProjectLayout>{children}</ProjectLayout>;
}
