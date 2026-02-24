'use client';

import { Button } from '@/components/ui/button';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { ProjectCreateInput } from '@/contracts/project';
import { cn } from '@/lib/utils';
import { GripVertical, Plus, Circle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

type CreateFormData = ProjectCreateInput;

const CATEGORY_STYLES = {
  TODO: {
    label: 'To Do',
    colorClass: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400',
    borderClass: 'border-gray-200 dark:border-gray-700',
    dotClass: 'text-gray-400',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    colorClass: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    borderClass: 'border-blue-200 dark:border-blue-800',
    dotClass: 'text-blue-500',
  },
  DONE: {
    label: 'Done',
    colorClass: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    dotClass: 'text-emerald-500',
  },
} as const;

const PRESET_COLORS = [
  '#9CA3AF',
  '#6B7280',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#EAB308',
  '#84CC16',
  '#22C55E',
  '#10B981',
  '#14B8A6',
  '#06B6D4',
  '#0EA5E9',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#A855F7',
  '#D946EF',
  '#EC4899',
  '#F43F5E',
];

function ColorPicker({
  color,
  onSelect,
}: {
  color: string | undefined;
  onSelect: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          className='h-5 w-5 rounded-full border border-border shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-primary/40 transition-all'
          style={{ backgroundColor: color || '#9CA3AF' }}
          title='Change color'
        />
      </PopoverTrigger>
      <PopoverContent className='w-auto p-2' side='bottom' align='start'>
        <p className='text-xs font-medium text-muted-foreground mb-2 px-1'>Pick color</p>
        <div className='grid grid-cols-7 gap-1'>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type='button'
              className={cn(
                'h-6 w-6 rounded-full border transition-all hover:scale-110',
                color === c ? 'ring-2 ring-primary ring-offset-1' : 'border-transparent',
              )}
              style={{ backgroundColor: c }}
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SortableStatusItem(props: {
  id: string;
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

  const category =
    (props.form.watch(`statuses.${props.index}.category`) as keyof typeof CATEGORY_STYLES) ??
    'TODO';
  const color = props.form.watch(`statuses.${props.index}.color`);
  const catStyle = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.TODO;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center gap-2 rounded-lg border px-3 py-2 my-1.5 shadow-sm bg-card transition-colors',
        isDragging && 'opacity-50',
        catStyle.borderClass,
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className='cursor-grab text-muted-foreground hover:text-foreground shrink-0'
      >
        <GripVertical className='h-3.5 w-3.5' />
      </div>

      <ColorPicker
        color={color ?? undefined}
        onSelect={(c) => props.form.setValue(`statuses.${props.index}.color`, c)}
      />

      <div className='flex-1 flex items-center gap-1.5 min-w-0'>
        <span
          className={cn(
            'text-[10px] font-bold tracking-wider uppercase whitespace-nowrap shrink-0 px-1.5 py-0.5 rounded',
            catStyle.colorClass,
          )}
        >
          {catStyle.label}
        </span>
        <Input
          className='h-7 border-none bg-transparent px-0 font-semibold shadow-none focus-visible:ring-0 text-sm'
          placeholder='Status name'
          {...props.form.register(`statuses.${props.index}.name`)}
        />
      </div>

      <div className='flex gap-1 items-center shrink-0'>
        <Select
          value={category}
          onValueChange={(val) =>
            props.form.setValue(
              `statuses.${props.index}.category`,
              val as 'TODO' | 'IN_PROGRESS' | 'DONE',
            )
          }
        >
          <SelectTrigger className='h-7 w-[110px] text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='TODO'>To Do</SelectItem>
            <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
            <SelectItem value='DONE'>Done</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='h-7 w-7 text-destructive hover:text-destructive'
          onClick={props.onRemove}
          title='Remove status'
        >
          ✕
        </Button>
      </div>
    </div>
  );
}

export function ProjectStatusEditor({ form }: { form: UseFormReturn<CreateFormData> }) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'statuses',
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

      const currentValues = form.getValues('statuses');
      if (currentValues) {
        currentValues.forEach((_, idx) => {
          form.setValue(`statuses.${idx}.sequence`, idx);
        });
      }
    }
  }

  return (
    <div className='space-y-4 py-4'>
      <div className='flex items-center justify-between pb-4 border-b'>
        <div>
          <h3 className='text-lg font-medium'>Status Configuration</h3>
          <p className='text-sm text-muted-foreground'>
            Define the workflow statuses for your project
          </p>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          <div className='space-y-1'>
            {fields.map((field, index) => (
              <SortableStatusItem
                key={field.id}
                id={field.id}
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
        className='w-full border-dashed py-6 text-muted-foreground hover:text-foreground mt-4'
        onClick={() => {
          append({
            name: '',
            description: '',
            category: 'TODO',
            color: '#9CA3AF',
            sequence: fields.length,
          });
        }}
      >
        <Plus className='mr-2 h-4 w-4' />
        Add Status
      </Button>
    </div>
  );
}
