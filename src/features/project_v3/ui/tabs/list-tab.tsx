/* eslint-disable react-hooks/incompatible-library */
'use client';

import {
  getBoardIssueFacetsQueryOptions,
  listBoardIssuesQueryOptions,
} from '@/features/boards/api/actions';
import { ColumnFilter, DataTable, DataTablePagination, DataTableToolbar } from '@/components/table';
import { useQuery } from '@tanstack/react-query';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import React, { useEffect, useMemo } from 'react';
import { issueColumns } from '@/features/boards/ui/tables/issue-column';
import { CreateIssueButton } from '@/features/boards/ui/buttons/create-issue-btn';

type ListTabProps = { params: { boardId: string; projId: string } };

export function ListTab({ params }: ListTabProps) {
  const { boardId, projId } = params;

  const { data: issues } = useQuery(listBoardIssuesQueryOptions(boardId));
  const { data: issueFacets } = useQuery(getBoardIssueFacetsQueryOptions(boardId));

  const filterOptions = useMemo<ColumnFilter[]>(() => {
    if (!issueFacets) return [];
    const filters: ColumnFilter[] = [];
    if (issueFacets.types)
      filters.push({
        type: 'faceted',
        columnKey: 'typeId',
        title: 'Type',
        options: issueFacets.types,
      });
    if (issueFacets.priorities)
      filters.push({
        type: 'faceted',
        columnKey: 'priorityId',
        title: 'Priority',
        options: issueFacets.priorities,
      });
    if (issueFacets.statuses)
      filters.push({
        type: 'faceted',
        columnKey: 'statusId',
        title: 'Status',
        options: issueFacets.statuses,
      });
    if (issueFacets.assignees)
      filters.push({
        type: 'faceted',
        columnKey: 'assigneeId',
        title: 'Assignee',
        options: issueFacets.assignees,
      });
    return filters;
  }, [issueFacets]);

  const [selectedIssue, setSelectedIssues] = React.useState<Set<string>>(new Set());
  const rowSelection = React.useMemo(() => {
    return Object.fromEntries(selectedIssue.keys().map((key) => [key, true]));
  }, [selectedIssue]);

  const table = useReactTable({
    data: issues ?? [],
    columns: issueColumns,
    state: { columnVisibility: { id: false }, rowSelection },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: (updaterOrValue) => {
      if (typeof updaterOrValue === 'function') {
        const newSelection = updaterOrValue(rowSelection);
        setSelectedIssues(new Set(Object.keys(newSelection).filter((key) => newSelection[key])));
      } else {
        setSelectedIssues(
          new Set(Object.keys(updaterOrValue).filter((key) => updaterOrValue[key])),
        );
      }
    },
  });

  useEffect(() => () => setSelectedIssues(new Set()), []);

  return (
    <div className='flex flex-col gap-4 p-4'>
      <DataTableToolbar
        table={table}
        config={{
          searchPlaceholder: 'Search issues...',
          searchColumn: 'summary',
          filters: filterOptions,
          actions: [
            {
              label: 'Create Issue',
              renderLabel: (label: string) => (
                <CreateIssueButton
                  key='create-issue'
                  params={{ boardId, projectId: projId }}
                  btnLabel={label}
                />
              ),
              variant: 'outline',
            },
          ],
        }}
      />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
}
