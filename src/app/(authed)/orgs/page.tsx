'use client';

import React, { Suspense, useState } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { presignUpload } from '@/lib/api/upload-api';
import { orgAPI } from '@/features/organization/api/http';

import { AppHeader } from './components/app-header';
import { OrgListPageHeader } from './components/org-list-page-header';
import { InvitationsSection } from './components/invitations';
import { OrgList, OrgListSkeleton } from './components/organizations';
import { CreateOrgForm, CreateOrgFormData } from './components/create-org-form';

export default function Page() {
  const [createOrgDialogOpen, setCreateOrgDialogOpen] = useState(false);

  const handleCreateOrg = async (data: CreateOrgFormData) => {
    let logoURL: string | null = null;

    if (data.logo instanceof File) {
      const logoFile = data.logo;

      const { uploadURL, assetKey } = await presignUpload({
        kind: 'org-logo',
        fileName: logoFile.name,
        fileSize: logoFile.size,
        fileType: logoFile.type,
      });

      await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': logoFile.type },
        body: logoFile,
      });

      logoURL = assetKey;
    } else {
      logoURL = data.logo;
    }

    return orgAPI.create({ ...data, logo: logoURL });
  };

  const createMutation = useMutation({
    mutationFn: handleCreateOrg,
    onSuccess: (newOrg) => {
      window.location.href = `/o/${newOrg.slug}`;
    },
  });

  return (
    <div className='w-screen h-screen flex flex-col'>
      <div className='w-full py-4'>
        <AppHeader />
      </div>

      <Separator />

      <div className='p-8 size-full max-w-7xl mx-auto h-full overflow-y-auto flex flex-col gap-6'>
        <Dialog open={createOrgDialogOpen} onOpenChange={setCreateOrgDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>Organization creation form goes here.</DialogDescription>
            </DialogHeader>

            <Separator />

            <CreateOrgForm
              onCancel={() => setCreateOrgDialogOpen(false)}
              onSubmit={(form) => createMutation.mutate(form)}
              isSubmitting={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <OrgListPageHeader onCreateOrgBtnClick={() => setCreateOrgDialogOpen(true)} />
        <InvitationsSection />

        <Suspense fallback={<OrgListSkeleton />}>
          <OrgList />
        </Suspense>
      </div>
    </div>
  );
}
