/* eslint-disable react/display-name */

import React, { memo } from 'react';
import { DndContext } from '@dnd-kit/core';

type KanbanItemProps = {
  value: string | null;
  label: string | React.ReactNode;

  onDragStart?: (event: React.DragEvent) => void;
};

type KanbanColumnProps = {
  value: string | null;
  label: string | React.ReactNode;
  items: KanbanItemProps[];
  onDragStart?: (event: React.DragEvent) => void;
  onDragEnd?: (event: React.DragEvent) => void;

  onItemDrop?: (sourceIndex: number, destinationIndex: number) => void;
};

type KanbanBoardProps = {
  columns: KanbanColumnProps[];
  onColumnDrop?: (sourceIndex: number, destinationIndex: number) => void;
  onItemDrop?: (
    source: { columnIndex: number; itemIndex: number },
    destination: { columnIndex: number; itemIndex: number },
  ) => void;
};

export const KanbanBoard = memo((props: KanbanBoardProps) => {
  const { columns } = props;

  return (
    <DndContext>
      <div className='flex space-x-4 overflow-x-auto p-4'>
        {columns.map((column, columnIndex) => (
          <div
            key={column.value || columnIndex}
            className='bg-gray-100 rounded-lg p-4 min-w-[250px]'
          >
            <h2 className='text-lg font-semibold mb-4'>{column.label}</h2>
            <div className='space-y-2'>
              {column.items.map((item, itemIndex) => (
                <div
                  key={item.value || itemIndex}
                  className='bg-white rounded shadow p-2 cursor-move'
                  draggable
                  onDragStart={(e) => column.onDragStart && column.onDragStart(e)}
                  onDragEnd={(e) => column.onDragEnd && column.onDragEnd(e)}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  );
});
