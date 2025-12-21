import React from 'react';

import { ChevronDown, ChevronRight, GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getContrastHexColor } from '@/lib/colord';
import { ProjectImport } from '@/contracts/projects';

const TypesSetup = () => {
  const form = useFormContext<ProjectImport>();
  const [open, setOpen] = React.useState(false);

  const { fields, remove } = useFieldArray({ control: form.control, name: 'types' });

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
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary'>
            <Layers className='h-5 w-5' />
          </div>
          <div>
            <h3 className='font-semibold'>Task Types Configuration</h3>
            <p className='text-sm text-muted-foreground'>
              {fields?.length || 0} type{(fields?.length || 0) !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {fields && fields.length > 0 && (
            <div className='hidden gap-1 sm:flex'>
              {fields.slice(0, 3).map(({ name, color }, index) => {
                const { color: rawColor, contrast } = getContrastHexColor(color);
                return (
                  <Badge
                    key={index}
                    variant='secondary'
                    className='text-xs'
                    style={{ backgroundColor: rawColor, color: contrast }}
                  >
                    {name}
                  </Badge>
                );
              })}
              {fields.length > 3 && (
                <Badge variant='outline' className='text-xs'>
                  +{fields.length - 3}
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
              <Layers className='mb-3 h-12 w-12 text-muted-foreground/50' />
              <p className='text-sm text-muted-foreground'>No task types configured yet</p>
              <p className='text-xs text-muted-foreground'>
                Add your first task type to get started
              </p>
            </div>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className='group flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:border-primary/50'
              >
                <GripVertical className='h-4 w-4 cursor-grab text-muted-foreground' />
                <Input
                  {...form.register(`types.${index}.name`)}
                  placeholder='Type name (e.g., Bug, Feature)'
                  className='flex-1'
                />
                <Input
                  {...form.register(`types.${index}.color`)}
                  type='color'
                  className='h-9 w-14 cursor-pointer p-1'
                />
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
            ))
          )}
        </div>
        <Button type='button' variant='outline' size='sm' className='mt-4 w-full gap-2'>
          <Plus className='h-4 w-4' />
          Add Task Type
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default TypesSetup;
