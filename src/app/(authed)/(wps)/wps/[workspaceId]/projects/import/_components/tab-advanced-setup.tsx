/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';

import {
  TypesSetup,
  StatusesSetup,
  PrioritiesSetup,
  ActorsSetup,
  RolesSetup,
} from '@/features/projects/ui/import';

export default function AdvancedSetupTab() {
  return (
    <div className='flex flex-col gap-4'>
      <TypesSetup />
      <StatusesSetup />
      <PrioritiesSetup />
      <RolesSetup />
      <ActorsSetup />
    </div>
  );
}
