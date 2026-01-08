import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InstructionInput } from '../instruction-input';
import { useAtom } from 'jotai';
import { instructionAtom } from '../../state/project-import-atom';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

const defaultSuggestions = [
  'Create an eCommerce project including proposed stories, epics, and tasks',
  'Create a project management system for a 5-person team (backlog + sprint)',
  'Create a landing page project with analytics tracking and a launch checklist',
];

export type ImportProjectButtonProps = {
  onImport?: (file: File) => void | Promise<void>;
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
};

export default function AICreateProjectButton({ label = 'Gen with AI' }: ImportProjectButtonProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [instruction, setInstruction] = useAtom(instructionAtom);

  const handleSend = (i: string) => {
    if (!searchParams || !pathname || !router) return;
    const query = new URLSearchParams(searchParams);
    query.set('a', 'send');
    query.set('i', i);
    router.push(`${pathname}/import?${query.toString()}`);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          <Sparkles />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className='min-w-0 w-[calc(100vw-2rem)] max-w-[900px] max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>AI Generate Project</DialogTitle>
          <DialogDescription>Generate a project from AI</DialogDescription>
        </DialogHeader>

        <div className='min-w-0 space-y-3'>
          <InstructionInput onSend={handleSend} />

          <div
            hidden={instruction.trim().length > 0}
            className='max-h-[200px] overflow-y-auto flex flex-col gap-2'
          >
            {defaultSuggestions.map((s) => (
              <Button
                key={s}
                type='button'
                variant='secondary'
                onClick={() => setInstruction(s)}
                className='whitespace-normal h-auto text-left wrap-break-words'
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
