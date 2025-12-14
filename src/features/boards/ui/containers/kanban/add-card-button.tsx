'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AddCardButtonProps = { onClick: () => void };
export function AddCardButton({ onClick }: AddCardButtonProps) {
  return (
    <Button
      variant='ghost'
      className='w-full justify-start text-muted-foreground hover:text-foreground mt-2'
      onClick={onClick}
    >
      <Plus className='h-4 w-4 mr-2' />
      Add card
    </Button>
  );
}
