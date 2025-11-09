'use client';

import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface StatusDropdownProps {
  defaultStatus?: string;
  value?: string;
  disabled?: boolean;
  onChange?: (status: string) => void;
}

export default function StatusDropdown({
  defaultStatus = 'To Do',
  value,
  disabled,
  onChange,
}: StatusDropdownProps) {
  const [status, setStatus] = useState<string>(value ?? defaultStatus);

  // keep internal state in sync when controlled `value` changes
  useEffect(() => {
    if (value !== undefined && value !== status) setStatus(value);
  }, [value]);

  const handleChange = (value: string) => {
    setStatus(value);
    onChange?.(value);
  };

  const statusColor =
    {
      'To Do': 'text-gray-600 border-gray-300 bg-gray-50',
      'In Progress': 'text-blue-600 border-blue-300 bg-blue-50',
      Done: 'text-green-600 border-green-300 bg-green-50',
    }[status] || 'text-gray-600';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          disabled={disabled}
          className={`font-medium flex items-center gap-2 ${statusColor}`}
        >
          <span>{status}</span>
          <ChevronDown className='w-4 h-4 text-gray-500' />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='start' sideOffset={4} className='w-48'>
        <DropdownMenuLabel>Change status</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuRadioGroup value={status} onValueChange={handleChange}>
          <DropdownMenuRadioItem value='To Do' className='data-[state=checked]:bg-gray-100'>
            To Do
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='In Progress' className='data-[state=checked]:bg-blue-100'>
            In Progress
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='Done' className='data-[state=checked]:bg-green-100'>
            Done
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className='text-gray-500'>More actions</DropdownMenuLabel>
        <DropdownMenuRadioItem value='create'>Create status</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='edit'>Edit status</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value='workflow'>View workflow</DropdownMenuRadioItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
