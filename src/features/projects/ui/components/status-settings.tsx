import { useQuery } from '@tanstack/react-query';
import { listProjectStatusesQueryOptions } from '../../api/actions';
import { Button } from '@/components/ui/button';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';

type Status = {
  id: string;
  name: string;
  category: string;
  sequence?: number;
};

type StatusSettingsProps = {
  projectId: string;
};

const categories = ['TODO', 'IN_PROGRESS', 'DONE'];

// Component cho từng status item có thể drag được
const DraggableStatusItem = ({ status }: { status: Status }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
    data: {
      type: 'status',
      status,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        mb-2 p-3 bg-white border rounded-lg cursor-move 
        hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 shadow-lg' : 'hover:bg-gray-50'}
      `}
    >
      <div className='flex items-center gap-2'>
        <div className='w-2 h-2 bg-gray-400 rounded-full'></div>
        <span className='text-sm font-medium'>{status.name}</span>
      </div>
    </li>
  );
};

const CategoryDropZone = ({
  category,
  statuses,
  onAddStatus,
  isOver,
}: {
  category: string;
  statuses: Status[];
  onAddStatus: (category: string) => void;
  isOver: boolean;
}) => {
  const statusIds = statuses.map((status) => status.id);

  return (
    <div
      className={`
        border-2 rounded-lg p-4 min-h-[300px] transition-all duration-200
        ${isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'}
      `}
    >
      <div className='flex items-center justify-between mb-3'>
        <h3 className='text-lg font-semibold text-gray-700'>{category.replace('_', ' ')}</h3>
        <span className='text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full'>
          {statuses.length}
        </span>
      </div>

      <Button
        variant='outline'
        size='sm'
        className='w-full mb-3 border-dashed'
        onClick={() => onAddStatus(category)}
      >
        + Add Status
      </Button>

      <SortableContext items={statusIds} strategy={verticalListSortingStrategy}>
        <ul className='space-y-1'>
          {statuses.length === 0 ? (
            <li className='text-center text-gray-400 text-sm py-8 border-2 border-dashed border-gray-200 rounded-lg'>
              Drop statuses here
            </li>
          ) : (
            statuses.map((status) => <DraggableStatusItem key={status.id} status={status} />)
          )}
        </ul>
      </SortableContext>
    </div>
  );
};

export const StatusSettings = (props: StatusSettingsProps) => {
  const [activeStatus, setActiveStatus] = useState<Status | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Status[]>([]);
  const [overId, setOverId] = useState<string | null>(null);

  const { data: statuses = [] } = useQuery(
    listProjectStatusesQueryOptions({ projectId: props.projectId }),
  );

  // Initialize local state when data loads
  useState(() => {
    if (statuses.length > 0 && localStatuses.length === 0) {
      setLocalStatuses(statuses);
    }
  }, [statuses]);

  // Update local state when server data changes
  if (statuses.length > 0 && localStatuses.length === 0) {
    setLocalStatuses(statuses);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const status = active.data.current?.status;
    if (status) {
      setActiveStatus(status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? (over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveStatus(null);
    setOverId(null);

    if (!over) return;

    const activeStatus = active.data.current?.status;
    if (!activeStatus) return;

    let targetCategory = activeStatus.category;

    // Xác định category đích
    if (over.data.current?.status) {
      // Drop trên một status khác
      targetCategory = over.data.current.status.category;
    } else {
      // Drop trên category container
      const overCategory = categories.find(
        (cat) => over.id === cat || (typeof over.id === 'string' && over.id.includes(cat)),
      );
      if (overCategory) {
        targetCategory = overCategory;
      }
    }

    // Cập nhật local state để có feedback tức thì
    if (targetCategory !== activeStatus.category) {
      setLocalStatuses((prev) =>
        prev.map((status) =>
          status.id === activeStatus.id ? { ...status, category: targetCategory } : status,
        ),
      );

      console.log(
        `Moved "${activeStatus.name}" from ${activeStatus.category} to ${targetCategory}`,
      );
    }
  };

  const handleAddStatus = (category: string) => {
    // Tạo status mới cho demo
    const newStatus: Status = {
      id: `temp-${Date.now()}`,
      name: `New Status ${localStatuses.length + 1}`,
      category,
    };

    setLocalStatuses((prev) => [...prev, newStatus]);
    console.log('Added new status to category:', category);
  };

  // Group statuses by category
  const statusesByCategory = categories.reduce((acc, category) => {
    acc[category] = localStatuses.filter((status) => status.category === category);
    return acc;
  }, {} as Record<string, Status[]>);

  return (
    <div className='p-6 bg-gray-100 min-h-screen'>
      <div className='max-w-6xl mx-auto'>
        <h2 className='text-2xl font-bold mb-6 text-gray-800'>
          Status Settings for Project: {props.projectId}
        </h2>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {categories.map((category) => (
              <CategoryDropZone
                key={category}
                category={category}
                statuses={statusesByCategory[category]}
                onAddStatus={handleAddStatus}
                isOver={overId === category}
              />
            ))}
          </div>

          <DragOverlay>
            {activeStatus ? (
              <div className='p-3 bg-white border-2 border-blue-400 rounded-lg shadow-2xl cursor-move transform rotate-3'>
                <div className='flex items-center gap-2'>
                  <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                  <span className='text-sm font-medium'>{activeStatus.name}</span>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
