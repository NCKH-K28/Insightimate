'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreateProjectDialog } from '@/features/projects/ui/create-project-dialog';

export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setOpen(true)}>Create Project</Button>
      <CreateProjectDialog open={open} onOpenChange={setOpen} values={{ leadId: '' }} />
    </div>
  );
}
