'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';

import { ProjectItem } from '@/contracts/project';
import {
  fetchProjectsQueryOptions,
  fetchProjectFacetsQueryOptions,
} from '@/features/project/api/actions';
import { DataTable, DataTableToolbar, DataTablePagination } from '@/components/table';
import { ColumnFilter } from '@/components/table/data-table-toolbar';
import { CreateProjectDialog } from '@/features/project/ui/create-project-dialog';

import { projectColumns } from './project-column';

interface ProjectsTableProps {
  initialData: ProjectItem[];
  orgId: string;
}

export function ProjectsTable({ initialData, orgId }: ProjectsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [createOpen, setCreateOpen] = useState(false);

  const { data: projects } = useQuery({
    ...fetchProjectsQueryOptions({ filter: { orgId } }),
    initialData: {
      data: initialData,
      meta: { page: 0, pageSize: initialData.length, total: initialData.length },
    },
  });

  const { data: facets } = useQuery(fetchProjectFacetsQueryOptions({ filter: { orgId } }));

  const filters: ColumnFilter[] = [
    {
      columnKey: 'type',
      title: 'Type',
      type: 'faceted',
      options: facets?.types?.map((t) => ({ label: t.label, value: t.value })) ?? [],
    },
    {
      columnKey: 'leadId',
      title: 'Lead',
      type: 'faceted',
      options:
        facets?.leads?.map((l) => ({
          label:
            typeof l.label === 'object' && l.label !== null
              ? (l.label as { name: string }).name
              : String(l.value),
          value: l.value,
        })) ?? [],
    },
  ];

  const table = useReactTable({
    data: projects ?? [],
    columns: projectColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        config={{
          searchColumn: 'project',
          searchPlaceholder: 'Search projects...',
          filters,
          actions: [
            {
              label: 'Create Project',
              icon: PlusIcon,
              onClick: () => setCreateOpen(true),
            },
          ],
        }}
      />

      <div className='rounded-md border'>
        <DataTable table={table} />
      </div>

      <DataTablePagination table={table} />

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        values={{ leadId: '', orgId }}
      />
    </div>
  );
}
