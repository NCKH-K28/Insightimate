'use client';

import * as React from 'react';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { OrgMemberItem } from '@/contracts/organizations/organization.query';

type Role = OrgMemberItem['role'];
const ROLE_LABELS: Record<Role, string> = {
  ORG_OWNER: 'Owner',
  ORG_ADMIN: 'Admin',
  ORG_MEMBER: 'Member',
};

type Member = OrgMemberItem;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export type OrgMemberActionsProps = { hiddens?: { remove?: boolean }; onRemove?: () => void };
export const OrgMemberActions: React.FC<OrgMemberActionsProps> = ({ hiddens, onRemove }) => {
  const anyActions = Array.from(Object.values(hiddens ?? {})).some((v) => !v);
  if (!anyActions) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0' aria-label='Open menu'>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          {!hiddens?.remove && (
            <DropdownMenuItem onClick={() => onRemove?.()}>Remove member</DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type BuildColumnsParams = {
  roleChoices: Role[];
  onRemoveMember?: (member: Member) => void;
  canRemove?: (member: Member) => boolean;
};

export function buildColumns({
  roleChoices,
  onRemoveMember,
  canRemove,
}: BuildColumnsParams): ColumnDef<Member>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'user',
      accessorFn: (row) => row.user?.name,
      header: ({ column }) => (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className='px-0'
        >
          User
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original.user;
        if (!user) return <span className='text-muted-foreground'>Unknown User</span>;
        return (
          <div className='flex items-center gap-2'>
            <Avatar className='h-8 w-8'>
              <AvatarImage src={user.avatar || undefined} alt={user.name} className='size-8' />
              <AvatarFallback className='size-8'>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className='min-w-0'>
              <div className='truncate font-medium'>{user.name}</div>
              <div className='truncate text-sm text-muted-foreground'>{user.email}</div>
            </div>
          </div>
        );
      },
    },

    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => ROLE_LABELS[row.original.role] ?? row.original.role,
      // Cho phép filterValue là mảng roles
      filterFn: (row, columnId, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) return true;
        const role = row.getValue(columnId) as Role;
        return (filterValue as Role[]).includes(role);
      },
      meta: { roleChoices },
    },

    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const member = row.original;
        return (
          <OrgMemberActions
            hiddens={{ remove: !canRemove?.(member) }}
            onRemove={() => onRemoveMember?.(member)}
          />
        );
      },
    },
  ];
}

type OrgMembersListProps = {
  members: Member[];
  roleOptions?: string[];
  onRemoveMember?: (member: Member) => void;
  canRemove?: (member: Member) => boolean;
};

export function OrgMembersList({
  members,
  roleOptions,
  onRemoveMember,
  canRemove,
}: OrgMembersListProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const roleChoices = React.useMemo<Role[]>(() => {
    const fallback = Object.keys(ROLE_LABELS) as Role[];
    if (!roleOptions || roleOptions.length === 0) return fallback;
    const set = new Set(fallback);
    return roleOptions.filter((r): r is Role => set.has(r as Role)) as Role[];
  }, [roleOptions]);

  const columns = React.useMemo(
    () => buildColumns({ roleChoices, onRemoveMember, canRemove }),
    [roleChoices, onRemoveMember, canRemove],
  );

  const table = useReactTable({
    data: members,
    columns,
    getRowId: (row) => row.userId,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: { sorting, columnFilters, columnVisibility, rowSelection },
  });

  const userColumn = table.getColumn('user');
  const roleColumn = table.getColumn('role');

  const selectedRoles = (roleColumn?.getFilterValue() as Role[] | undefined) ?? [];
  const toggleRole = (role: Role, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedRoles, role]))
      : selectedRoles.filter((r) => r !== role);

    roleColumn?.setFilterValue(next.length ? next : undefined);
  };

  return (
    <div className='w-full space-y-3'>
      {/* Toolbar: Search + Role filter */}
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search by name…'
            value={(userColumn?.getFilterValue() as string) ?? ''}
            onChange={(e) => userColumn?.setFilterValue(e.target.value)}
            className='w-full sm:w-64'
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                Role
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-48'>
              <DropdownMenuLabel>Filter roles</DropdownMenuLabel>
              <DropdownMenuGroup>
                {roleChoices.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => toggleRole(role, Boolean(checked))}
                  >
                    {ROLE_LABELS[role]}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className='text-sm text-muted-foreground'>
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} selected
        </div>
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-end space-x-2 py-2'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
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
}

export const OrgMembersListSkeleton: React.FC = () => {
  return (
    <div className='w-full space-y-3'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <Skeleton className='h-8 w-full sm:w-64 rounded-md' />
        <Skeleton className='h-8 w-24 rounded-md' />
      </div>

      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Skeleton className='h-4 w-12 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-24 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-16 rounded-md' />
              </TableHead>
              <TableHead>
                <Skeleton className='h-4 w-8 rounded-md' />
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className='h-6 w-6 rounded-md' />
                </TableCell>
                <TableCell>
                  <div className='flex flex-col gap-1'>
                    <Skeleton className='h-4 w-32 rounded-md' />
                    <Skeleton className='h-3 w-48 rounded-md' />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20 rounded-md' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-6 rounded-md' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-end space-x-2 py-2'>
        <Skeleton className='h-8 w-20 rounded-md' />
        <Skeleton className='h-8 w-20 rounded-md' />
      </div>
    </div>
  );
};
