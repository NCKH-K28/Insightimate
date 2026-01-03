'use client';

import React from 'react';
import { PlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

type OrgListPageHeaderProps = { onCreateOrgBtnClick?: () => void };

export const OrgListPageHeader: React.FC<OrgListPageHeaderProps> = ({ onCreateOrgBtnClick }) => (
  <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
    <div>
      <h1 className='text-3xl font-bold text-slate-800'>Your Organizations</h1>
      <p className='text-slate-500 mt-1 text-sm'>
        Manage your teams, projects, and billing across all organizations.
      </p>
    </div>
    <div className='flex items-center gap-2'>
      <Button onClick={onCreateOrgBtnClick}>
        <PlusIcon className='w-4 h-4' />
        Create Organization
      </Button>
    </div>
  </div>
);
