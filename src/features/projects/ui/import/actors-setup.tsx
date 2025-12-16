import React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProjectImport } from '@/contracts/projects';

const ActorsSetup = () => {
  const form = useFormContext<ProjectImport>();
  const [open, setOpen] = React.useState(false);

  const actors = useWatch({ control: form.control, name: 'actors' });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className='group flex w-full items-center justify-between rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500'>
            <Users className='h-5 w-5' />
          </div>
          <div>
            <h3 className='font-semibold'>Project Actors Configuration</h3>
            <p className='text-sm text-muted-foreground'>
              {actors?.length || 0} actor
              {(actors?.length || 0) !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className='h-5 w-5 text-muted-foreground transition-transform' />
        ) : (
          <ChevronRight className='h-5 w-5 text-muted-foreground transition-transform' />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className='mt-2'>
        <div className='rounded-lg border bg-card p-4'>{/* Actor configuration content */}</div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default ActorsSetup;
