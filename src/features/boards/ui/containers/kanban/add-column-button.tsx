'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AddColumnButtonProps {
  onClick: () => void;
}

export function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <div className='flex-shrink-0 w-72'>
      <Button variant='outline' className='w-full h-12 border-dashed' onClick={onClick}>
        <Plus className='h-4 w-4 mr-2' />
        Add column
      </Button>
    </div>
  );
}
