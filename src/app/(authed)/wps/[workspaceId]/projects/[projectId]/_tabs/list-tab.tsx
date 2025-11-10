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

type ListTabProps = { params: { boardId: string; projectId: string; workspaceId: string } };
export const ListTab = (props: ListTabProps) => {
  const boardId = props.params.boardId;

  const { data: issues } = useQuery(listBoardIssuesQueryOptions(boardId));
  const { data: issueFacets } = useQuery(getBoardIssueFacetsQueryOptions(boardId));

  const filterOptions = useMemo<ColumnFilter[]>(() => {
    if (!issueFacets) return [];
    const filters: ColumnFilter[] = [];

    if (issueFacets.types) {
      filters.push({
        type: 'faceted',
        columnKey: 'typeId',
        title: 'Type',
        options: issueFacets.types,
      });
    }

    if (issueFacets.priorities) {
      filters.push({
        type: 'faceted',
        columnKey: 'priorityId',
        title: 'Priority',
        options: issueFacets.priorities,
      });
    }

    if (issueFacets.statuses) {
      filters.push({
        type: 'faceted',
        columnKey: 'statusId',
        title: 'Status',
        options: issueFacets.statuses,
      });
    }

    if (issueFacets.assignees) {
      filters.push({
        type: 'faceted',
        columnKey: 'assigneeId',
        title: 'Assignee',
        options: issueFacets.assignees,
      });
    }

    return filters;
  }, [issueFacets]);

  // Local state
  const [selectedIssue, setSelectedIssues] = React.useState<Set<string>>(new Set());

  const rowSelection = React.useMemo(() => {
    const keys = selectedIssue.keys();
    return Object.fromEntries(keys.map((key) => [key, true]));
  }, [selectedIssue]);

  // Table configuration
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
        const selectedIssues = Object.keys(newSelection).filter((key) => newSelection[key]);
        setSelectedIssues(new Set(selectedIssues));
      } else {
        const selectedIssues = Object.keys(updaterOrValue).filter((key) => updaterOrValue[key]);
        setSelectedIssues(new Set(selectedIssues));
      }
    },
  });

  // Side effects
  useEffect(() => {
    return () => {
      setSelectedIssues(new Set());
    };
  }, [setSelectedIssues]);

  return (
    <div className='flex flex-col gap-4 p-4'>
      <DataTableToolbar
        table={table}
        config={{
          searchPlaceholder: 'Search issues...',
          searchColumn: 'summary',
          filters: filterOptions,
        }}
      />
      <DataTable table={table} />
      <DataTablePagination table={table} />
    </div>
  );
};
