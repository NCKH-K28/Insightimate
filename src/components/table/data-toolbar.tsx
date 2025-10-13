'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Table } from '@tanstack/react-table';
import { Cross2Icon, PlusCircledIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { MixerHorizontalIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

import { DataTableFacetedFilter } from './data-table-faceted-filter';

type DataTableToolbarProps<TData> = { table: Table<TData> };
export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const router = useRouter();
  const isFiltered = table.getState().columnFilters.length > 0;
  const [departments, setDepartments] = useState<string[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [hireDate, setHireDate] = useState<Date | undefined>(undefined);
  const column = table.getColumn('hireDate');

  // Fetch departments and employment types from the API
  useEffect(() => {
    // Fetch departments
    fetch('/api/warehouse/departments')
      .then((res) => res.json())
      .then((data) => {
        setDepartments(data.map((item: { name: string }) => item.name));
      })
      .catch((err) => {
        console.error('Error fetching departments:', err);
        // Fallback data
        setDepartments(['IT', 'HR', 'Finance', 'Marketing', 'Operations']);
      });

    // Fetch employment types
    fetch('/api/warehouse/employment-types')
      .then((res) => res.json())
      .then((data) => {
        setEmploymentTypes(data);
      })
      .catch((err) => {
        console.error('Error fetching employment types:', err);
        // Fallback data
        setEmploymentTypes(['Full-time', 'Part-time', 'Contract', 'Seasonal', 'Intern']);
      });
  }, []);

  // Handle date selection
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      setHireDate(date);
      if (date && column) {
        // Convert date to YYYYMMDD format for filtering
        const dateFormatted = format(date, 'yyyyMMdd');
        column.setFilterValue(parseInt(dateFormatted));
      } else if (column) {
        column.setFilterValue(undefined);
      }
    },
    [column],
  );

  return (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='Search by name...'
          value={(table.getColumn('fullName')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('fullName')?.setFilterValue(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />

        {/* Department Filter */}
        {table.getColumn('department') && departments.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn('department')}
            title='Department'
            options={departments.map((dept) => ({
              label: dept,
              value: dept,
            }))}
          />
        )}

        {/* Employment Type Filter */}
        {table.getColumn('employmentType') && employmentTypes.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn('employmentType')}
            title='Employment Type'
            options={employmentTypes.map((type) => ({
              label: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
              value: type,
            }))}
          />
        )}

        {/* Gender Filter */}
        {table.getColumn('gender') && (
          <DataTableFacetedFilter
            column={table.getColumn('gender')}
            title='Gender'
            options={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non-binary' },
              { label: 'Other', value: 'other' },
            ]}
          />
        )}

        {/* Status Filter */}
        {table.getColumn('isCurrent') && (
          <DataTableFacetedFilter
            column={table.getColumn('isCurrent')}
            title='Status'
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' },
            ]}
          />
        )}

        {/* Hire Date Filter */}
        {column && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className={cn('h-8 border-dashed', hireDate && 'text-muted-foreground')}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {hireDate ? format(hireDate, 'PPP') : 'Hire Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={hireDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        )}

        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters();
              setHireDate(undefined);
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <Button
          variant='default'
          size='sm'
          className='h-8'
          onClick={() => router.push('/employees/new')}
        >
          <PlusCircledIcon className='mr-2 h-4 w-4' />
          Add Employee
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>;
}

export function DataTableViewOptions<TData>({ table }: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='ml-auto hidden h-8 lg:flex'>
          <MixerHorizontalIcon className='mr-2 h-4 w-4' />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[150px]'>
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map((column) => {
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
