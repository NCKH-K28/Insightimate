import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContrastHexColor } from '@/lib/colord';
import { ProjectImport } from '@/contracts/projects';

const PrioritiesSetup = () => {
  const form = useFormContext<ProjectImport>();
  const [open, setOpen] = React.useState(false);

  const keyName = 'project.priorities';
  const { fields, append, remove } = useFieldArray({ control: form.control, name: keyName });
  const priorities = useWatch({ control: form.control, name: keyName });

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className='border rounded-lg bg-card overflow-hidden'
    >
      <CollapsibleTrigger
        className={cn(
          'group flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent',
          open && 'border-b',
        )}
      >
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500'>
            <Flag className='h-5 w-5' />
          </div>
          <div>
            <h3 className='font-semibold'>Task Priorities Configuration</h3>
            <p className='text-sm text-muted-foreground'>
              {priorities?.length || 0} priority level
              {(priorities?.length || 0) !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {priorities && priorities.length > 0 && (
            <div className='hidden gap-1 sm:flex'>
              {priorities.slice(0, 3).map(({ name, color }, index) => {
                const { color: rawColor, contrast: contrastColor } = getContrastHexColor(color);
                return (
                  <Badge
                    key={index}
                    style={{ backgroundColor: rawColor, color: contrastColor }}
                    className='text-xs'
                  >
                    {name}
                  </Badge>
                );
              })}
              {priorities.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{priorities.length - 3}
                </Badge>
              )}
            </div>
          )}
          {open ? (
            <ChevronDown className='h-5 w-5 text-muted-foreground transition-transform' />
          ) : (
            <ChevronRight className='h-5 w-5 text-muted-foreground transition-transform' />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className='p-4'>
        <div className='space-y-3'>
          {fields.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8 text-center'>
              <Flag className='mb-3 h-12 w-12 text-muted-foreground/50' />
              <p className='text-sm text-muted-foreground'>No priorities configured yet</p>
              <p className='text-xs text-muted-foreground'>
                Add priority levels to help organize task urgency
              </p>
            </div>
          ) : (
            fields.map((field, index) => {
              return (
                <div
                  key={field.id}
                  className='group flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:border-primary/50'
                >
                  <GripVertical className='h-4 w-4 cursor-grab text-muted-foreground' />
                  <Input
                    {...form.register(`project.priorities.${index}.name`)}
                    placeholder={`Priority name (e.g., Low, Medium, High)`}
                    className='flex-1'
                  />
                  <Input
                    {...form.register(`project.priorities.${index}.color`)}
                    type='color'
                    className='h-9 w-14 cursor-pointer p-1'
                  />
                  <Badge variant='outline' className='min-w-12 justify-center text-xs font-mono'>
                    {index + 1}
                  </Badge>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    onClick={() => remove(index)}
                    className='opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              );
            })
          )}
        </div>
        <div className='mt-4 flex gap-2'>
          <Button type='button' variant='outline' size='sm' className='flex-1 gap-2'>
            <Plus className='h-4 w-4' />
            Add Priority Level
          </Button>
          {fields.length === 0 && (
            <Button type='button' variant='secondary' size='sm' className='gap-2'>
              <Flag className='h-4 w-4' />
              Use Defaults
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
export default PrioritiesSetup;
