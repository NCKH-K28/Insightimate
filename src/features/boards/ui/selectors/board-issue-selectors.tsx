import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CheckIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useControlledState } from '@/hooks/use-controlled-state';
import { listBoardIssuesQueryOptions } from '../../api/actions';
import { BoardIssueQueryParams } from '@/contracts/boards/boards.query';

type IssueOption = {
  id: string;
  key: string;
  summary: string;
  type: {
    id: string;
    name: string;
    hierarchy: number;
    iconURL?: string | null;
    color?: string | null;
  };
};

type BoardIssueSelectorsProps = {
  params: { workspaceId: string; boardId: string };
  value?: string | null;
  onChange?: (value: string | null) => void;
  defaultValue?: string | null;
  placeholder?: string;
  renderPlaceholder?: () => React.ReactNode;
  disabled?: boolean;
  className?: string;
  onFetched?: (issues: IssueOption[], setValue: (value: string | null) => void) => void;
  queryFilter?: BoardIssueQueryParams;
  fetchMode?: 'mount' | 'always';
};

const BoardIssueSelectors: React.FC<BoardIssueSelectorsProps> = ({
  params,
  onChange,
  renderPlaceholder,
  placeholder = 'Select an issue.. .',
  disabled = false,
  className,
  onFetched,
  queryFilter,
  fetchMode = 'mount',
  ...props
}) => {
  const [value, setValue] = useControlledState<string | null>(
    props.value,
    props.defaultValue ?? null,
    onChange,
  );

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFetchEnabled, setIsFetchEnabled] = useState(fetchMode === 'always');

  const {
    data: issues,
    isLoading,
    isError,
  } = useQuery({
    ...listBoardIssuesQueryOptions(params.boardId, queryFilter),
    enabled: isFetchEnabled,
  });

  // Call onFetched callback when issues are loaded
  useEffect(() => {
    if (issues && onFetched) onFetched(issues, setValue);
  }, [issues, onFetched, setValue]);

  // Filter issues based on search query
  const filteredIssues = useMemo(() => {
    if (!issues) return [];
    if (!searchQuery.trim()) return issues;

    const query = searchQuery.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.key.toLowerCase().includes(query) || issue.summary.toLowerCase().includes(query),
    );
  }, [issues, searchQuery]);

  // Get selected issue
  const selectedIssue = useMemo(() => {
    if (!value || !issues) return null;
    return (issues as IssueOption[]).find((issue) => issue.id === value) ?? null;
  }, [value, issues]);

  // Handle issue selection
  const handleSelect = useCallback(
    (issueId: string) => {
      const newValue = issueId === value ? null : issueId;
      setValue(newValue);
      setOpen(false);
      setSearchQuery('');
    },
    [value, setValue],
  );

  // Handle open change
  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchQuery('');
    }
  }, []);

  const RenderedPlaceholder = useMemo(() => {
    if (renderPlaceholder) return renderPlaceholder();
    return <span className='text-muted-foreground'>{placeholder}</span>;
  }, [renderPlaceholder, placeholder]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled || isLoading}
          onClick={() => {
            setIsFetchEnabled(true);
          }}
          className={cn(
            'w-full justify-between font-normal',
            !selectedIssue && 'text-muted-foreground',
            className,
          )}
        >
          {isLoading ? (
            <span className='flex items-center gap-2'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Loading...
            </span>
          ) : selectedIssue ? (
            <span className='flex items-center gap-2 truncate'>
              <span className='truncate'>{selectedIssue.summary}</span>
            </span>
          ) : (
            RenderedPlaceholder
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[400px] p-0' align='start'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Search issues...'
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className='flex items-center justify-center py-6'>
                <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
              </div>
            ) : isError ? (
              <CommandEmpty>Failed to load issues</CommandEmpty>
            ) : filteredIssues.length === 0 ? (
              <CommandEmpty>No issues found</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredIssues.map((issue) => (
                  <CommandItem
                    key={issue.id}
                    value={issue.id}
                    onSelect={() => handleSelect(issue.id)}
                    className='flex items-center gap-2 cursor-pointer'
                  >
                    {/* Issue type icon */}
                    {issue.type.iconURL ? (
                      <Image
                        src={issue.type.iconURL}
                        alt={issue.type.name}
                        width={16}
                        height={16}
                        className='flex-shrink-0'
                      />
                    ) : (
                      <div
                        className='w-4 h-4 rounded-sm flex-shrink-0'
                        style={{ backgroundColor: issue.type.color || '#6554C0' }}
                      />
                    )}

                    {/* Issue key */}
                    <span className='text-xs font-medium text-muted-foreground flex-shrink-0'>
                      {issue.key}
                    </span>

                    {/* Issue summary */}
                    <span className='truncate flex-1'>{issue.summary}</span>

                    {/* Check icon for selected */}
                    <CheckIcon
                      className={cn(
                        'ml-auto h-4 w-4 flex-shrink-0',
                        value === issue.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default BoardIssueSelectors;
export { BoardIssueSelectors };
export type { BoardIssueSelectorsProps, IssueOption };
