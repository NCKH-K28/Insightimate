'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import { RHFInputCell, RHFSelectCell } from './cells';
import { Option, RowItem } from './types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type BuildColumnsOptions = {
  typesOpts?: Option[];
  statusOpts?: Option[];
  assigneeOpts?: Option[];
  priorityOpts?: Option[];
};
export const buildColumns = ({
  typesOpts,
  statusOpts,
  assigneeOpts,
  priorityOpts,
}: BuildColumnsOptions): ColumnDef<RowItem>[] => {
  return [
    {
      id: 'select',
      header: ({ table }) => {
        const isAllSelected = table.getIsAllPageRowsSelected();
        const isSomeSelected = table.getIsSomePageRowsSelected();
        return (
          <Checkbox
            checked={isAllSelected || (isSomeSelected && 'indeterminate')}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label='Select all'
          />
        );
      },
      cell: ({ row }) => {
        const isSelected = row.getIsSelected();
        return (
          <Checkbox
            checked={isSelected}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label={`Select row ${row.index + 1}`}
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    {
      accessorKey: 'id',
      header: 'Key',
      cell: ({ getValue }) => {
        const value = getValue<string>();
        return (
          <Tooltip>
            <TooltipTrigger>
              <span className='min-w-12 max-w-18 block text-start truncate'>{value}</span>
            </TooltipTrigger>
            <TooltipContent>
              <span>{value}</span>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row, getValue }) => {
        const value = getValue<string>();
        if (!typesOpts || typesOpts.length === 0) return <span>{value}</span>;
        const name = `issues.${row.index}.typeId` as const;
        return <RHFSelectCell name={name} options={typesOpts} />;
      },
    },
    {
      accessorKey: 'summary',
      header: 'Summary',
      cell: ({ row }) => {
        const name = `issues.${row.index}.summary` as const;
        return <RHFInputCell name={name} className='min-w-64' />;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row, getValue }) => {
        const value = getValue<string>();
        if (!statusOpts || statusOpts.length === 0) return <span>{value}</span>;
        const name = `issues.${row.index}.statusId` as const;
        return <RHFSelectCell name={name} options={statusOpts} />;
      },
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      cell: ({ row, getValue }) => {
        const value = getValue<string>();
        if (!priorityOpts || priorityOpts.length === 0) return <span>{value}</span>;
        const name = `issues.${row.index}.priorityId` as const;
        return <RHFSelectCell name={name} options={priorityOpts} />;
      },
    },
    {
      accessorKey: 'assignee',
      header: 'Assignee',
      cell: ({ row, getValue }) => {
        const value = getValue<string>();
        if (!assigneeOpts || assigneeOpts.length === 0) return <span>{value}</span>;
        const name = `issues.${row.index}.assigneeId` as const;
        return <RHFSelectCell name={name} options={assigneeOpts} />;
      },
    },
  ];
};
