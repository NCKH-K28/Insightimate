import React, { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Plus, User, UserMinus } from 'lucide-react';
import { UserPublic } from '@/contracts/user';

export type UserSelectValue = UserPublic | null;

export interface UserSelectProps {
  // Core props
  value?: UserSelectValue;
  defaultValue?: UserSelectValue;
  onValueChange?: (value: UserSelectValue) => void;
  onSelect?: (user: UserPublic | null) => void; // Legacy support

  // Data fetching
  options?: UserPublic[]; // Static options
  fetchOptions?: (query: string) => Promise<UserPublic[]>; // Dynamic fetch

  // Appearance
  variant?: 'default' | 'circle' | 'compact' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  placeholder?: string;
  className?: string;

  // Behavior
  disabled?: boolean;
  required?: boolean; // New: không cho phép null
  allowUnassigned?: boolean; // New: cho phép chọn "Unassigned"
  unassignedLabel?: string; // New: label cho option unassigned
  clearable?: boolean; // Deprecated when allowUnassigned is true
  searchable?: boolean;
  searchPlaceholder?: string;

  // Display options
  displayField?: keyof UserPublic | ((user: UserPublic) => string);
  showAvatar?: boolean;
  showEmail?: boolean;

  // Filtering
  filter?: (user: UserPublic, query: string) => boolean;
  exclude?: string[]; // User IDs to exclude

  // Loading states
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;

  // Advanced
  allowCustomValue?: boolean;
  createLabel?: string;
  onCreate?: (value: string) => void | Promise<UserPublic>;

  // Validation
  error?: string;
}

export const UserSelect: React.FC<UserSelectProps> = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  onSelect,
  options = [],
  fetchOptions,
  variant = 'default',
  size = 'md',
  placeholder = 'Select user...',
  className,
  disabled = false,
  required = false,
  allowUnassigned = false,
  unassignedLabel = 'Unassigned',
  clearable = false,
  searchable = true,
  searchPlaceholder = 'Search users...',
  displayField = 'name',
  showAvatar = true,
  showEmail = false,
  filter,
  exclude = [],
  loading = false,
  emptyMessage = 'No users found',
  loadingMessage = 'Loading...',
  allowCustomValue = false,
  createLabel = 'Create',
  onCreate,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [internalValue, setInternalValue] = useState<UserSelectValue>(defaultValue || null);
  const [fetchedOptions, setFetchedOptions] = useState<UserPublic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Use controlled or uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  // Determine if clearable/unassigned should be shown
  const showUnassignedOption = allowUnassigned || (!required && clearable);
  // const canClear = !required && (clearable || allowUnassigned);

  // Get display text for a user
  const getDisplayText = (user: UserPublic): string => {
    if (typeof displayField === 'function') {
      return displayField(user);
    }
    return user[displayField] as string;
  };

  // Get user object from value
  const getUserFromValue = (val: UserSelectValue): UserPublic | null => {
    if (!val) return null;
    if (typeof val === 'object') return val;

    // Find user by ID
    const allOptions = [...options, ...fetchedOptions];
    return allOptions.find((user) => user.id === val) || null;
  };

  const selectedUser = getUserFromValue(value);

  // Fetch options when search query changes
  useEffect(() => {
    if (!fetchOptions || !searchQuery.trim()) {
      setFetchedOptions([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchData = async () => {
      try {
        const results = await fetchOptions(searchQuery);
        if (!cancelled) {
          setFetchedOptions(results);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (!cancelled) {
          setFetchedOptions([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(fetchData, 300); // Debounce

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      setIsLoading(false);
    };
  }, [searchQuery, fetchOptions]);

  // Filter and combine options
  const filteredOptions = useMemo(() => {
    const allOptions = [...options, ...fetchedOptions];

    // Remove duplicates
    const uniqueOptions = allOptions.filter(
      (user, index, arr) => arr.findIndex((u) => u.id === user.id) === index,
    );

    // Apply exclusions
    const nonExcludedOptions = uniqueOptions.filter((user) => !exclude.includes(user.id));

    // Apply search filter
    if (!searchQuery.trim()) return nonExcludedOptions;

    return nonExcludedOptions.filter((user) => {
      if (filter) {
        return filter(user, searchQuery);
      }

      // Default search behavior
      const query = searchQuery.toLowerCase();
      return user.name?.toLowerCase().includes(query) || user.email?.toLowerCase().includes(query);
    });
  }, [options, fetchedOptions, exclude, searchQuery, filter]);

  // Handle selection
  const handleSelect = (user: UserPublic | null) => {
    const newValue = user;

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    onValueChange?.(newValue);
    onSelect?.(user); // Legacy support
    setOpen(false);
    setSearchQuery('');
  };

  // Handle unassigned selection
  const handleUnassigned = () => {
    handleSelect(null);
  };

  // Handle custom value creation
  const handleCreate = async () => {
    if (!onCreate || !searchQuery.trim()) return;

    try {
      const result = await onCreate(searchQuery);
      if (result) {
        handleSelect(result);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  // // Handle clear
  // const handleClear = (e: React.MouseEvent) => {
  //   e.preventDefault();
  //   e.stopPropagation();
  //   if (canClear) {
  //     handleSelect(null);
  //   }
  // };

  // Get placeholder text
  const getPlaceholderText = () => {
    if (selectedUser) return getDisplayText(selectedUser);
    if (!selectedUser && allowUnassigned) return unassignedLabel;
    return placeholder;
  };

  // Render trigger based on variant
  const renderTrigger = () => {
    const sizeClasses = {
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-md',
      lg: 'w-12 h-12 text-lg',
    };

    const hasError = !!error;
    const isUnassigned = !selectedUser;

    switch (variant) {
      case 'circle':
        return (
          <Button
            variant='outline'
            size='icon'
            className={cn(
              'rounded-full',
              !selectedUser && 'border-dashed',
              hasError && 'border-destructive',
              sizeClasses[size],
              className,
            )}
            disabled={disabled}
          >
            {selectedUser ? (
              <Avatar className={cn(sizeClasses[size])}>
                <AvatarImage src={selectedUser.avatar || ''} />
                <AvatarFallback>{selectedUser.name[0].toUpperCase() || '?'}</AvatarFallback>
              </Avatar>
            ) : (
              <User className='h-4 w-4' />
            )}
          </Button>
        );

      case 'compact':
        return (
          <Button
            variant='outline'
            className={cn(
              'justify-start gap-2 px-2',
              sizeClasses[size],
              hasError && 'border-destructive',
              isUnassigned && allowUnassigned && 'text-muted-foreground',
              className,
            )}
            disabled={disabled}
          >
            {selectedUser && showAvatar && (
              <Avatar className='h-5 w-5'>
                <AvatarImage src={selectedUser.avatar || ''} />
                <AvatarFallback className='text-xs'>
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            {isUnassigned && allowUnassigned && <UserMinus className='h-4 w-4' />}
            <span className='flex-1 truncate text-left'>{getPlaceholderText()}</span>
          </Button>
        );

      case 'minimal':
        return (
          <Button
            variant='ghost'
            className={cn(
              'justify-start gap-2 px-1',
              sizeClasses[size],
              !selectedUser && 'text-muted-foreground',
              hasError && 'text-destructive',
              className,
            )}
            disabled={disabled}
          >
            {selectedUser && showAvatar && (
              <Avatar className='h-5 w-5'>
                <AvatarImage src={selectedUser.avatar || ''} />
                <AvatarFallback className='text-xs'>
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            {isUnassigned && allowUnassigned && <UserMinus className='h-4 w-4' />}
            <span className='flex-1 truncate text-left'>{getPlaceholderText()}</span>
          </Button>
        );

      default:
        return (
          <Button
            variant='outline'
            role='combobox'
            aria-expanded={open}
            aria-required={required}
            className={cn(
              'justify-between',
              sizeClasses[size],
              hasError && 'border-destructive',
              className,
            )}
            disabled={disabled}
          >
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              {selectedUser && showAvatar && (
                <Avatar className='h-5 w-5 shrink-0'>
                  <AvatarImage src={selectedUser.avatar || ''} />
                  <AvatarFallback className='text-xs'>
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              {isUnassigned && allowUnassigned && (
                <UserMinus className='h-4 w-4 shrink-0 text-muted-foreground' />
              )}
              <span
                className={cn(
                  'truncate',
                  isUnassigned && allowUnassigned && 'text-muted-foreground',
                  !selectedUser && !allowUnassigned && 'text-muted-foreground',
                )}
              >
                {getPlaceholderText()}
              </span>
              {showEmail && selectedUser?.email && (
                <span className='text-xs text-muted-foreground truncate'>
                  ({selectedUser.email})
                </span>
              )}
            </div>

            <div className='flex items-center gap-1 shrink-0'>
              <ChevronsUpDown className='h-4 w-4 opacity-50' />
            </div>
          </Button>
        );
    }
  };

  // Render user item
  const renderUserItem = (user: UserPublic) => (
    <CommandItem
      key={user.id}
      value={user.id}
      onSelect={() => handleSelect(user)}
      className='flex items-center gap-2'
    >
      {showAvatar && (
        <Avatar className='h-6 w-6'>
          <AvatarImage src={user.avatar || ''} />
          <AvatarFallback className='text-xs'>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}

      <div className='flex-1 min-w-0'>
        <div className='truncate'>{getDisplayText(user)}</div>
        {showEmail && user.email && (
          <div className='text-xs text-muted-foreground truncate'>{user.email}</div>
        )}
      </div>

      <Check
        className={cn('h-4 w-4', selectedUser?.id === user.id ? 'opacity-100' : 'opacity-0')}
      />
    </CommandItem>
  );

  // Render unassigned item
  const renderUnassignedItem = () => (
    <CommandItem
      value='__unassigned__'
      onSelect={handleUnassigned}
      className='flex items-center gap-2'
    >
      <UserMinus className='h-6 w-6 text-muted-foreground' />
      <div className='flex-1'>
        <div className='text-muted-foreground'>{unassignedLabel}</div>
      </div>
      <Check className={cn('h-4 w-4', !selectedUser ? 'opacity-100' : 'opacity-0')} />
    </CommandItem>
  );

  return (
    <div className='w-full'>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>

        {/* FIXME: no-drag */}
        <PopoverContent className='w-80 p-0 no-drag' align='start'>
          <Command shouldFilter={false}>
            {searchable && (
              <CommandInput
                placeholder={searchPlaceholder}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            )}

            <CommandList>
              {isLoading || loading ? (
                <CommandEmpty>{loadingMessage}</CommandEmpty>
              ) : (
                <>
                  {/* Unassigned Option */}
                  {showUnassignedOption && <CommandGroup>{renderUnassignedItem()}</CommandGroup>}

                  {/* Users */}
                  {filteredOptions.length > 0 && (
                    <>
                      {showUnassignedOption && <CommandSeparator />}
                      <CommandGroup>{filteredOptions.map(renderUserItem)}</CommandGroup>
                    </>
                  )}

                  {/* Custom Value Creation */}
                  {allowCustomValue && onCreate && searchQuery.trim() && (
                    <>
                      {(filteredOptions.length > 0 || showUnassignedOption) && <CommandSeparator />}
                      <CommandGroup>
                        <CommandItem onSelect={handleCreate}>
                          <Plus className='h-4 w-4 mr-2' />
                          {createLabel} &quot;{searchQuery}&quot;
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}

                  {/* Empty State */}
                  {filteredOptions.length === 0 && !allowCustomValue && (
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Error Message */}
      {error && <p className='text-sm text-destructive mt-1'>{error}</p>}
    </div>
  );
};
