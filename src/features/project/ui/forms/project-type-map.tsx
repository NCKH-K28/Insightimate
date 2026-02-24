'use client';

import { Button } from '@/components/ui/button';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { ProjectCreateInput } from '@/contracts/project';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, Plus, Rocket, Book, Bug, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Image from 'next/image';
import { useState } from 'react';

const AVAILABLE_ICONS = [
  { label: 'Epic', url: '/icons/issue-type/epic.svg' },
  { label: 'Story', url: '/icons/issue-type/story.svg' },
  { label: 'Bug', url: '/icons/issue-type/bug.svg' },
  { label: 'Task', url: '/icons/issue-type/task.svg' },
  { label: 'Sub-task', url: '/icons/issue-type/sub-task.svg' },
] as const;

type IconPickerProps = {
  iconURL: string | null | undefined;
  colorClass: string;
  fallbackIcon: React.ReactNode;
  onSelect: (url: string) => void;
};

function IconPicker({ iconURL, colorClass, fallbackIcon, onSelect }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className={cn(
            'p-1.5 rounded shrink-0 flex items-center justify-center cursor-pointer',
            'hover:ring-2 hover:ring-offset-1 hover:ring-primary/40 transition-all',
            colorClass,
          )}
          title='Change icon'
        >
          {iconURL ? (
            <Image src={iconURL} alt='type icon' width={16} height={16} className='h-4 w-4' />
          ) : (
            fallbackIcon
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-2' side='bottom' align='start'>
        <p className='text-xs font-medium text-muted-foreground mb-2 px-1'>Choose icon</p>
        <div className='grid grid-cols-5 gap-1'>
          {AVAILABLE_ICONS.map((icon) => (
            <button
              key={icon.url}
              type='button'
              className={cn(
                'p-2 rounded-md hover:bg-accent transition-colors flex flex-col items-center gap-1',
                iconURL === icon.url && 'bg-accent ring-1 ring-primary',
              )}
              onClick={() => {
                onSelect(icon.url);
                setOpen(false);
              }}
              title={icon.label}
            >
              <Image src={icon.url} alt={icon.label} width={20} height={20} />
              <span className='text-[9px] text-muted-foreground'>{icon.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type CreateFormData = ProjectCreateInput;

// Simple map for icons/colors based on assumed type name conventions
// Using colors somewhat resembling the screenshot: Epic (purple), Story (green), Bug (red), Subtask/Task (blue)
const getTypeStyle = (name: string, hierarchy: number) => {
  const lowerName = name.toLowerCase();

  if (hierarchy === 2 || lowerName.includes('epic')) {
    return {
      icon: <Rocket className='h-4 w-4' />,
      colorClass: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400',
      borderClass: 'border-purple-200 dark:border-purple-800',
      label: 'LEVEL 3 • EPIC',
    };
  }
  if (lowerName.includes('bug')) {
    return {
      icon: <Bug className='h-4 w-4' />,
      colorClass: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
      borderClass: 'border-red-200 dark:border-red-800',
      label: 'LEVEL 2 • BUG',
    };
  }
  if (hierarchy === 1 || lowerName.includes('story')) {
    return {
      icon: <Book className='h-4 w-4' />,
      colorClass: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      label: 'LEVEL 2 • STORY',
    };
  }

  // Default for Level 1 / Subtask
  return {
    icon: <CheckSquare className='h-4 w-4' />,
    colorClass: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400',
    borderClass: 'border-cyan-200 dark:border-cyan-800',
    label: hierarchy === 0 ? 'LEVEL 0 • SUBTASK' : `LEVEL ${hierarchy}`,
  };
};

function SortableItem(props: {
  id: string;
  field: any;
  index: number;
  form: UseFormReturn<CreateFormData>;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  };

  const name = props.form.watch(`types.${props.index}.name`);
  const hierarchy = props.form.watch(`types.${props.index}.hierarchy`) ?? 0;
  const typeStyle = getTypeStyle(name || '', hierarchy);

  // Determine indentation based on hierarchy level (2 is root, 0 is deepest)
  const indentLevel = 2 - Math.max(0, Math.min(2, hierarchy));
  const marginLeft = `${indentLevel * 2.5}rem`;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft }}
      className={cn(
        'relative flex items-center gap-2 rounded-lg border px-3 py-2 my-1.5 shadow-sm bg-card transition-colors',
        isDragging && 'opacity-50',
        typeStyle.borderClass,
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab text-muted-foreground hover:text-foreground shrink-0'
      >
        <GripVertical className='h-3.5 w-3.5' />
      </div>

      <IconPicker
        iconURL={props.form.watch(`types.${props.index}.iconURL`)}
        colorClass={typeStyle.colorClass}
        fallbackIcon={typeStyle.icon}
        onSelect={(url) => props.form.setValue(`types.${props.index}.iconURL`, url)}
      />

      <div className='flex-1 flex items-center gap-1.5 min-w-0'>
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0',
            typeStyle.colorClass,
            'bg-transparent',
          )}
        >
          {`LEVEL ${hierarchy} •`}
        </span>
        <Input
          className='h-7 border-none bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0 text-sm'
          placeholder='Type name'
          {...props.form.register(`types.${props.index}.name`)}
        />
      </div>

      <div className='flex gap-0.5 items-center shrink-0'>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-7 w-7 text-xs text-muted-foreground'
          onClick={() => {
            const current = props.form.getValues(`types.${props.index}.hierarchy`) ?? 0;
            props.form.setValue(
              `types.${props.index}.hierarchy`,
              current === 2 ? 0 : Math.min(2, current + 1),
            );
          }}
          title='Change level'
        >
          {hierarchy}
        </Button>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-7 w-7 text-destructive hover:text-destructive'
          onClick={props.onRemove}
          title='Remove type'
        >
          ✕
        </Button>
      </div>
    </div>
  );
}

export const ProjectTypeMap = ({ form }: { form: UseFormReturn<CreateFormData> }) => {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'types',
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      move(oldIndex, newIndex);

      // Update sequences after move
      const currentValues = form.getValues('types');
      if (currentValues) {
        currentValues.forEach((_, idx) => {
          form.setValue(`types.${idx}.sequence`, idx);
        });
      }
    }
  }

  return (
    <div className='space-y-4 py-4'>
      <div className='flex items-center justify-between pb-4 border-b'>
        <div>
          <h3 className='text-lg font-medium'>Project Architecture</h3>
          <p className='text-sm text-muted-foreground'>
            Drag nodes to reorganize the hierarchy structure
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className='space-y-1 relative'>
            {/* We could add generic connecting lines behind the items here */}
            <div className='absolute left-6 top-4 bottom-4 w-px bg-border -z-10 hidden sm:block'></div>

            {fields.map((field, index) => (
              <SortableItem
                key={field.id}
                id={field.id}
                field={field}
                index={index}
                form={form}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type='button'
        variant='outline'
        className='w-full border-dashed py-8 text-muted-foreground hover:text-foreground mt-6'
        onClick={() => {
          append({ name: 'New Epic', description: '', hierarchy: 2, sequence: fields.length });
        }}
      >
        <Plus className='mr-2 h-4 w-4' />
        Initialize New Root Epic (Level 2)
      </Button>
    </div>
  );
};
