'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Filter, Users, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  StatusBadge,
  UserAvatar,
  IssueTypeIcon,
  PriorityIcon,
} from './board-view/helper-components';
import { mockIssueTypes, mockPriorities, mockStatuses, mockUsers } from '../mock-data';

interface FilterState {
  assignees: string[];
  types: string[];
  priorities: string[];
  statuses: string[];
}

function FilterPanel({
  filters,
  setFilters,
  isOpen,
  onClose,
}: {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    setFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: FilterState = {
      assignees: [],
      types: [],
      priorities: [],
      statuses: [],
    };
    setLocalFilters(emptyFilters);
    setFilters(emptyFilters);
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setLocalFilters((prev) => {
      const current = prev[category];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const activeFilterCount =
    localFilters.assignees.length +
    localFilters.types.length +
    localFilters.priorities.length +
    localFilters.statuses.length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className='w-full sm:max-w-md'>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Refine the issues displayed in this sprint</SheetDescription>
        </SheetHeader>

        <div className='py-6 space-y-6'>
          {/* Assignee Filter */}
          <div>
            <Label className='text-sm font-medium mb-3 block'>Assignee</Label>
            <div className='space-y-2'>
              {mockUsers.map((user) => (
                <div key={user.id} className='flex items-center gap-2'>
                  <Checkbox
                    id={`assignee-${user.id}`}
                    checked={localFilters.assignees.includes(user.id)}
                    onCheckedChange={() => toggleFilter('assignees', user.id)}
                  />
                  <label
                    htmlFor={`assignee-${user.id}`}
                    className='flex items-center gap-2 text-sm cursor-pointer'
                  >
                    <UserAvatar user={user} size='sm' showTooltip={false} />
                    {user.name}
                  </label>
                </div>
              ))}
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='assignee-unassigned'
                  checked={localFilters.assignees.includes('unassigned')}
                  onCheckedChange={() => toggleFilter('assignees', 'unassigned')}
                />
                <label
                  htmlFor='assignee-unassigned'
                  className='flex items-center gap-2 text-sm cursor-pointer'
                >
                  <UserAvatar size='sm' showTooltip={false} />
                  Unassigned
                </label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Type Filter */}
          <div>
            <Label className='text-sm font-medium mb-3 block'>Type</Label>
            <div className='space-y-2'>
              {mockIssueTypes.map((type) => (
                <div key={type.id} className='flex items-center gap-2'>
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={localFilters.types.includes(type.id)}
                    onCheckedChange={() => toggleFilter('types', type.id)}
                  />
                  <label
                    htmlFor={`type-${type.id}`}
                    className='flex items-center gap-2 text-sm cursor-pointer'
                  >
                    <IssueTypeIcon type={type} />
                    {type.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Priority Filter */}
          <div>
            <Label className='text-sm font-medium mb-3 block'>Priority</Label>
            <div className='space-y-2'>
              {mockPriorities.map((priority) => (
                <div key={priority.id} className='flex items-center gap-2'>
                  <Checkbox
                    id={`priority-${priority.id}`}
                    checked={localFilters.priorities.includes(priority.id)}
                    onCheckedChange={() => toggleFilter('priorities', priority.id)}
                  />
                  <label
                    htmlFor={`priority-${priority.id}`}
                    className='flex items-center gap-2 text-sm cursor-pointer'
                  >
                    <PriorityIcon priority={priority} />
                    {priority.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status Filter */}
          <div>
            <Label className='text-sm font-medium mb-3 block'>Status</Label>
            <div className='space-y-2'>
              {mockStatuses.map((status) => (
                <div key={status.id} className='flex items-center gap-2'>
                  <Checkbox
                    id={`status-${status.id}`}
                    checked={localFilters.statuses.includes(status.id)}
                    onCheckedChange={() => toggleFilter('statuses', status.id)}
                  />
                  <label
                    htmlFor={`status-${status.id}`}
                    className='flex items-center gap-2 text-sm cursor-pointer'
                  >
                    <StatusBadge status={status} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className='flex-row gap-2'>
          <Button variant='outline' onClick={handleClear} className='flex-1'>
            Clear all
            {activeFilterCount > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Button onClick={handleApply} className='flex-1'>
            Apply filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Toolbar({
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  onCreateIssue,
}: {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  onCreateIssue: () => void;
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAssigneeFilter, setShowAssigneeFilter] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeFilterCount =
    filters.assignees.length +
    filters.types.length +
    filters.priorities.length +
    filters.statuses.length;

  // Focus search on Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-b bg-background'>
        <div className='flex items-center gap-2 sm:gap-3 flex-1'>
          <div className='relative flex-1 sm:flex-none'>
            <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              ref={searchInputRef}
              placeholder='Search issues... (⌘F)'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9 w-full sm:w-64 h-9'
            />
            {searchQuery && (
              <Button
                variant='ghost'
                size='icon'
                className='absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6'
                onClick={() => setSearchQuery('')}
              >
                <X className='h-3 w-3' />
              </Button>
            )}
          </div>

          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsFilterOpen(true)}
            className='relative'
          >
            <Filter className='h-4 w-4 mr-2' />
            <span className='hidden sm:inline'>Filters</span>
            {activeFilterCount > 0 && (
              <Badge
                variant='secondary'
                className='ml-2 h-5 min-w-5 px-1.5 text-xs bg-primary text-primary-foreground'
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          <Popover open={showAssigneeFilter} onOpenChange={setShowAssigneeFilter}>
            <PopoverTrigger asChild>
              <Button variant='outline' size='sm' className='hidden sm:flex'>
                <Users className='h-4 w-4 mr-2' />
                Assignee
                {filters.assignees.length > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {filters.assignees.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-56 p-2' align='start'>
              <div className='space-y-1'>
                {mockUsers.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      const newAssignees = filters.assignees.includes(user.id)
                        ? filters.assignees.filter((id) => id !== user.id)
                        : [...filters.assignees, user.id];
                      setFilters({ ...filters, assignees: newAssignees });
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-slate-100 transition-colors',
                      filters.assignees.includes(user.id) && 'bg-slate-100',
                    )}
                  >
                    <Checkbox
                      checked={filters.assignees.includes(user.id)}
                      className='pointer-events-none'
                    />
                    <UserAvatar user={user} size='sm' showTooltip={false} />
                    <span className='truncate'>{user.name}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Active filter badges */}
          {activeFilterCount > 0 && (
            <div className='hidden lg:flex items-center gap-1'>
              {filters.types.length > 0 && (
                <Badge variant='secondary' className='gap-1'>
                  Type: {filters.types.length}
                  <button
                    onClick={() => setFilters({ ...filters, types: [] })}
                    className='ml-1 hover:text-destructive'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              )}
              {filters.priorities.length > 0 && (
                <Badge variant='secondary' className='gap-1'>
                  Priority: {filters.priorities.length}
                  <button
                    onClick={() => setFilters({ ...filters, priorities: [] })}
                    className='ml-1 hover:text-destructive'
                  >
                    <X className='h-3 w-3' />
                  </button>
                </Badge>
              )}
              <Button
                variant='ghost'
                size='sm'
                className='h-6 px-2 text-xs text-muted-foreground'
                onClick={() =>
                  setFilters({
                    assignees: [],
                    types: [],
                    priorities: [],
                    statuses: [],
                  })
                }
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <div className='flex items-center gap-2'>
          <div className='flex items-center border rounded-lg p-0.5 bg-slate-50'></div>

          <Separator orientation='vertical' className='h-6 hidden sm:block' />

          <Button size='sm' onClick={onCreateIssue}>
            <Plus className='h-4 w-4 sm:mr-2' />
            <span className='hidden sm:inline'>Create issue</span>
          </Button>
        </div>
      </div>

      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </>
  );
}

export { Toolbar };
