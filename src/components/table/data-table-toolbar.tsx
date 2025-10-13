'use client';

import { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTableFacetedFilter } from './data-table-faceted-filter';
import { DataTableViewOptions } from './data-table-view-options';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { CalendarIcon, LucideIcon, XIcon as CrossIcon } from 'lucide-react';

import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string | number | boolean | null;
  icon?: LucideIcon;
}

export interface ColumnFilter {
  columnKey: string;
  title: string;
  options?: FilterOption[] | (() => Promise<FilterOption[]>);
  type?: 'faceted' | 'date' | 'search';
}

interface ActionButton {
  label: string | React.ReactNode;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

interface DataTableToolbarConfig {
  searchColumn?: string;
  searchPlaceholder?: string;
  filters?: ColumnFilter[];
  actions?: ActionButton[];
  showViewOptions?: boolean;
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  config: DataTableToolbarConfig;
}

export function DataTableToolbar<TData>({ table, config }: DataTableToolbarProps<TData>) {
  const [filterOptions, setFilterOptions] = useState<Record<string, FilterOption[]>>({});
  const [dateFilters, setDateFilters] = useState<Record<string, Date | undefined>>({});

  const columnFiltersState = table.getState().columnFilters;

  const isFiltered = useMemo(() => columnFiltersState.length > 0, [columnFiltersState.length]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      if (!config.filters) return;

      const asyncFilters = config.filters
        .filter((filter) => filter.type === 'faceted' && typeof filter.options === 'function')
        .map(async (filter) => ({
          columnKey: filter.columnKey,
          options: await (filter.options as () => Promise<FilterOption[]>)(),
        }));

      const syncFilters = config.filters
        .filter((filter) => filter.type === 'faceted' && Array.isArray(filter.options))
        .map((filter) => ({
          columnKey: filter.columnKey,
          options: filter.options as FilterOption[],
        }));

      const asyncResults = await Promise.all(asyncFilters);

      const options: Record<string, FilterOption[]> = {};
      [...syncFilters, ...asyncResults].forEach(({ columnKey, options: opts }) => {
        options[columnKey] = opts;
      });

      setFilterOptions(options);
    };

    loadFilterOptions();
  }, [config.filters]);

  const handleDateSelect = useCallback(
    (columnKey: string, date: Date | undefined) => {
      setDateFilters((prev) => ({ ...prev, [columnKey]: date }));
      const column = table.getColumn(columnKey);

      if (date && column) {
        const dateFormatted = format(date, 'yyyyMMdd');
        column.setFilterValue(parseInt(dateFormatted));
      } else if (column) {
        column.setFilterValue(undefined);
      }
    },
    [table],
  );

  const resetFilters = useCallback(() => {
    table.resetColumnFilters();
    setDateFilters({});
  }, [table]);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      table.getColumn(config.searchColumn!)?.setFilterValue(event.target.value);
    },
    [table, config.searchColumn],
  );

  const searchValue = useMemo(
    () =>
      config.searchColumn
        ? (table.getColumn(config.searchColumn)?.getFilterValue() as string) ?? ''
        : '',
    [table, config.searchColumn, columnFiltersState],
  );

  const renderedFilters = useMemo(() => {
    return config.filters?.map((filter) => {
      const column = table.getColumn(filter.columnKey);
      if (!column) return null;

      if (filter.type === 'faceted') {
        const options = filterOptions[filter.columnKey];
        if (!options?.length) return null;

        return (
          <DataTableFacetedFilter
            key={filter.columnKey}
            column={column}
            title={filter.title}
            options={options}
          />
        );
      }

      if (filter.type === 'date') {
        const selectedDate = dateFilters[filter.columnKey];

        return (
          <Popover key={filter.columnKey}>
            <PopoverTrigger asChild>
              <Button
                size='sm'
                className={cn('h-8 border-dashed', !selectedDate && 'text-muted-foreground')}
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {selectedDate ? format(selectedDate, 'PPP') : filter.title}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={(date) => handleDateSelect(filter.columnKey, date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
      }

      return null;
    });
  }, [config.filters, table, filterOptions, dateFilters, handleDateSelect, columnFiltersState]);

  return (
    <div className='flex flex-wrap items-center justify-between gap-2'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        {config.searchColumn && (
          <Input
            placeholder={config.searchPlaceholder || 'Search...'}
            value={searchValue}
            onChange={handleSearchChange}
            className='h-8 w-[150px] lg:w-[250px]'
          />
        )}

        {renderedFilters}

        {isFiltered && (
          <Button variant='ghost' onClick={resetFilters} className='h-8 px-2 lg:px-3'>
            Reset
            <CrossIcon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      <div className='flex items-center gap-2'>
        {config.actions?.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'default'}
            size='sm'
            className='h-8'
            onClick={action.onClick}
          >
            {action.icon && <action.icon className='mr-2 h-4 w-4' />}
            {action.label}
          </Button>
        ))}

        {config.showViewOptions !== false && <DataTableViewOptions table={table} />}
      </div>
    </div>
  );
}
