'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { useWatch, useFormContext } from 'react-hook-form';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { buildColumns } from './columns';
import { RowItem } from './types';
import { ProjectImport } from '@/contracts/project';
import { Input } from '@/components/ui/input';
import { useNoMemoTable } from '@/hooks/use-nomemo-table';

export const IssuesTable = () => {
  const form = useFormContext<ProjectImport>();

  const [rowSelection, setRowSelection] = React.useState({});
  const [isAddingRow, setIsAddingRow] = React.useState(false);

  const rows = useWatch({ control: form.control, name: 'issues' });

  const statuses = useWatch({ control: form.control, name: 'statuses' });
  const types = useWatch({ control: form.control, name: 'types' });
  const priorities = useWatch({ control: form.control, name: 'priorities' });

  const columns = React.useMemo<ColumnDef<RowItem>[]>(
    () =>
      buildColumns({
        typesOpts: types.map((t) => ({ ...t, value: t.id, label: t.name })),
        statusOpts: statuses.map((s) => ({ ...s, value: s.id, label: s.name })),
        assigneeOpts: [],
        priorityOpts: priorities.map((p) => ({
          ...p,
          value: p.id,
          label: p.name,
        })),
      }),
    [statuses, types, priorities],
  );

  const table = useNoMemoTable({
    data: rows,
    columns,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false,
  });

  const selectedIdx = table.getSelectedRowModel().flatRows.map((row) => row.index);

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex items-center gap-2'>
        {selectedIdx.length > 0 && (
          <Button
            type='button'
            variant='destructive'
            size='sm'
            onClick={() => {
              const currentRows = form.getValues('issues') || [];
              const selectedSet = new Set(selectedIdx);
              const newRows = currentRows.filter((_, index) => !selectedSet.has(index));
              form.setValue('issues', newRows);
              table.resetRowSelection();
            }}
          >
            Delete Selected
          </Button>
        )}

        <Button type='button' size='sm'>
          Commit
        </Button>

        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setIsAddingRow((prev) => !prev)}
        >
          {isAddingRow ? 'Cancel' : 'Add Row'}
        </Button>
        <div className='text-sm text-muted-foreground'>
          Selected: {table.getSelectedRowModel().rows.length}
        </div>
        {form.formState.errors && Object.keys(form.formState.errors).length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='text-sm text-destructive underline cursor-pointer'>
                Errors: {Object.keys(form.formState.errors).length}
              </span>
            </TooltipTrigger>
            <TooltipContent className='max-h-60 overflow-auto whitespace-pre-wrap'>
              {JSON.stringify(form.formState.errors, null, 2)}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className='rounded-md border'>
        <Table className='max-h-96 min-w-full overflow-scroll'>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isAddingRow ? null : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}

            {isAddingRow && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Input
                    autoFocus
                    placeholder='Type to add a new row...'
                    onBlur={() => setIsAddingRow(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const summary = e.currentTarget.value.trim();
                        if (summary !== '') {
                          const pkey = form.getValues('key') || '';
                          const currentRows = form.getValues('issues') || [];
                          const iKey = `${pkey}-${currentRows.length + 1}`;
                          const newRow: RowItem = {
                            id: iKey,
                            key: iKey,
                            summary,
                            assigneeId: null,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            description: null,
                            dueDate: null,
                            priorityId: '',
                            statusId: '',
                            typeId: '',
                            reporterId: '',
                            resolvedAt: null,
                            startDate: null,
                          };
                          form.setValue('issues', [...currentRows, newRow]);
                          e.currentTarget.value = '';
                        }
                        setIsAddingRow(false);
                      } else if (e.key === 'Escape') {
                        setIsAddingRow(false);
                      }
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Prev
        </Button>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
