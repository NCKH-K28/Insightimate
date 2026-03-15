'use client';

import React, { Suspense, useState } from 'react';

import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { AppHeader } from './components/app-header';
import { OrgListPageHeader } from './components/org-list-page-header';
import { OrgListSkeleton } from './components/organizations';
import { CreateOrgForm, CreateOrgFormData } from './components/create-org-form';
import dynamic from 'next/dynamic';

const OrgList = dynamic(() => import('./components/organizations').then((m) => m.OrgList), {
  ssr: false,
});

import { useCreateOrg } from '@/hooks/org';
import { toast } from 'sonner';
import { getErrorMsg } from '@/lib/api/helper';

export default function Page() {
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);
  const createOrg = useCreateOrg();

  const handleCreateOrg = async (data: CreateOrgFormData) => {
    await toast
      .promise(
        createOrg.mutateAsync(data, {
          onSuccess: () => setCreateOrgDialogOpen(false),
        }),
        {
          loading: 'Creating organization...',
          success: 'Organization created successfully!',
          error: (e) => getErrorMsg(e, 'Failed to create organization.'),
        },
      )
      .unwrap();
  };

  return (
    <div className='w-screen h-screen flex flex-col'>
      <AppHeader className='container mx-auto px-8 h-14' />

      <Separator />

      <div className='container mx-auto p-8 size-full h-full overflow-y-auto flex flex-col gap-6'>
        <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>Organization creation form goes here.</DialogDescription>
            </DialogHeader>

            <Separator />

            <CreateOrgForm
              onCancel={() => setCreateOrgDialogOpen(false)}
              onSubmit={(i) => handleCreateOrg(i)}
            />
          </DialogContent>
        </Dialog>

        <OrgListPageHeader onCreateOrgBtnClick={() => setCreateOrgDialogOpen(true)} />

        <Suspense fallback={<OrgListSkeleton />}>
          <OrgList />
        </Suspense>
      </div>
    </div>
  );
}
