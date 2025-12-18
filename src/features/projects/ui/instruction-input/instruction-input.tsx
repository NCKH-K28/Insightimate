'use client';

import { Button } from '@/components/ui/button';

import React, { useRef } from 'react';
import { Loader2, SendIcon, PlusIcon, PaperclipIcon } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAtom } from 'jotai';
import { ContextOption, ContextsBar } from './contexts-bar';
import { uploadFilePipe } from '@/lib/insight-ai/upload-file-pipe';
import { contextsAtom, instructionAtom } from '@/features/projects/state/project-import-atom';
import { cn } from '@/lib/utils';

// ================== Components ================== //
type InstructionInputProps = {
  onFileUploaded?: (fileRef: { key: string; filename: string; filepath: string }) => void;
  onSend?: (instruction: string, contexts?: ContextOption[]) => void;
  isLoading?: boolean;
};
const InstructionInput = ({ onSend, isLoading }: InstructionInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);

  const [instruction, setInstruction] = useAtom(instructionAtom);
  const [contexts, setContexts] = useAtom(contextsAtom);

  const addContext = (context: ContextOption) => {
    setContexts((prev) => [...prev, context]);
  };

  const updateContext = (v: string, context: Partial<ContextOption>) => {
    setContexts((prev) => {
      const exits = prev.some((item) => item.value === v);
      if (!exits) return prev;
      return prev.map((item) => {
        if (item.value === v) return { ...item, ...context };
        return item;
      });
    });
  };

  const removeContext = (v: string) => {
    setContexts((prev) => {
      const exits = prev.some((item) => item.value === v);
      if (!exits) return prev;
      return prev.filter((item) => item.value !== v);
    });
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const filename = file.name;
    const filepath = URL.createObjectURL(file);
    addContext({
      type: 'file',
      label: filename,
      value: filename,
      isLoading: true,
      iconURL: filepath,
    });
    try {
      const fileRef = await uploadFilePipe(file);
      if (!fileRef) {
        removeContext(filename);
        console.error('File upload failed');
        return null;
      }

      updateContext(filename, {
        isLoading: false,
        label: fileRef.filename,
        value: fileRef.key,
        iconURL: fileRef.filepath,
      });

      return fileRef;
    } catch (error) {
      removeContext(filename);
      console.error('File upload failed', error);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileRef = await uploadFile(file);
      if (fileRef) {
        console.log('Uploaded file:', fileRef);
        // You can also update the instruction or state here to reference the uploaded file
      }
    }

    // Clear the input value to allow re-uploading the same file if needed
    e.target.value = '';
  };

  const handleSend = async () => {
    const trimmed = instruction.trim();
    if (!trimmed) return;
    onSend?.(trimmed, contexts);
    setInstruction('');
  };

  return (
    <div className='bg-background border border-border rounded-2xl overflow-hidden'>
      <input
        ref={fileInputRef}
        type='file'
        multiple
        className='sr-only'
        accept='.pdf,.txt,.doc,.docx,'
        onChange={onFileChange}
      />
      <ContextsBar selected={contexts} onChange={setContexts} />

      <div className='px-3 pt-3 pb-2 grow flex flex-col gap-2'>
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder='Ask anything'
          className={cn(
            'w-full bg-transparent! p-0 border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder-muted-foreground resize-none border-none outline-none text-sm min-h-10 max-h-40',
          )}
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
              e.preventDefault();
              sendButtonRef.current?.click();
            }
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = target.scrollHeight + 'px';
          }}
        />

        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-1'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 w-7 p-0 rounded-full border border-border hover:bg-accent'
                >
                  <PlusIcon className='size-3' />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align='start' className='max-w-xs rounded-2xl p-1.5'>
                <DropdownMenuGroup className='space-y-1'>
                  <DropdownMenuItem
                    className='rounded-[calc(1rem-6px)] text-xs'
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <PaperclipIcon size={16} className='opacity-60' />
                    Attach Files
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <Button
              ref={sendButtonRef}
              type='button'
              onClick={handleSend}
              disabled={isLoading || instruction.trim().length === 0}
              className='size-7 p-0 rounded-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading && <Loader2 className='size-3 animate-spin' />}
              {isLoading || <SendIcon className='size-3 fill-primary' />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionInput;
