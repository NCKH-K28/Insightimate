import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ---------- Component ----------
// Notes:
// - Supports both clicking to pick a file and drag & drop.
// - Keeps the chosen file in state and disables Import until a file is selected.
// - Calls onImport(file) when the user clicks Import.

export type ImportProjectButtonProps = {
  /** Called when the user clicks Import with a selected file. */
  onImport?: (file: File) => void | Promise<void>;
  /** Optional accept attribute for the file input. Default: .csv,text/csv */
  accept?: string;
  /** Optional max size in bytes; if exceeded, shows an error and blocks import. */
  maxSizeBytes?: number;
  /** Optional label text */
  label?: string;
};

// default is json file
const DEFAULT_ACCEPT = '.json';
export default function ImportProjectButton({
  onImport,
  accept = DEFAULT_ACCEPT,
  maxSizeBytes,
  label = 'Import Project',
}: ImportProjectButtonProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const reset = React.useCallback(() => {
    setFile(null);
    setError(null);
    setIsDragging(false);
    setIsImporting(false);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  const validateAndSetFile = React.useCallback(
    (f: File | null) => {
      setError(null);
      if (!f) {
        setFile(null);
        return;
      }

      // Basic type/extension check (some browsers may not set type reliably).
      const nameOk = f.name.toLowerCase().endsWith('.json');
      const typeOk = f.type === 'application/json' || f.type === 'text/json' || f.type === ''; // unknown

      if (!nameOk && !typeOk) {
        setFile(null);
        setError('Please choose a CSV file.');
        return;
      }

      if (maxSizeBytes && f.size > maxSizeBytes) {
        setFile(null);
        setError(`File is too large. Max size is ${Math.round(maxSizeBytes / 1024 / 1024)}MB.`);
        return;
      }

      setFile(f);
    },
    [maxSizeBytes],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    validateAndSetFile(f);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const f = e.dataTransfer.files?.[0] ?? null;
    validateAndSetFile(f);

    // Keep the native input in sync so users can still see the chosen file in the file picker.
    // (Optional; not all browsers allow programmatically setting files.)
    // We intentionally avoid trying to set inputRef.current.files.
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Indicate copy is intended.
    e.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handlePickFile = () => inputRef.current?.click();

  const handleImport = async () => {
    if (!file || error) return;
    try {
      setIsImporting(true);
      await onImport?.(file);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        // Reset when closing so next open starts clean.
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant='outline' size='sm'>
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>Import a project from a CSV file</DialogDescription>
        </DialogHeader>

        <div className='space-y-2'>
          <Label htmlFor='file'>File</Label>

          {/* Dropzone */}
          <div
            role='button'
            tabIndex={0}
            aria-label='Drop a CSV file here'
            onClick={handlePickFile}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handlePickFile();
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={cn(
              'rounded-2xl border border-dashed p-4 transition',
              'outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isDragging ? 'bg-muted' : 'bg-background',
            )}
          >
            <div className='flex flex-col gap-2'>
              <div className='text-sm'>
                <span className='font-medium'>Drag & drop</span> your CSV here, or{' '}
                <span className='underline'>browse</span>
              </div>

              <div className='text-xs text-muted-foreground'>
                Accepted: CSV (.csv)
                {maxSizeBytes ? <> · Max: {Math.round(maxSizeBytes / 1024 / 1024)}MB</> : null}
              </div>

              {file ? (
                <div className='mt-1 rounded-xl border p-2 text-xs'>
                  <div className='font-medium'>Selected</div>
                  <div className='truncate'>{file.name}</div>
                </div>
              ) : null}

              {error ? <div className='text-xs text-destructive'>{error}</div> : null}
            </div>
          </div>

          {/* Hidden native input (kept for accessibility & mobile) */}
          <Input
            ref={inputRef}
            id='file'
            type='file'
            accept={accept}
            onChange={onInputChange}
            className='hidden'
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant='outline' disabled={isImporting}>
              Cancel
            </Button>
          </DialogClose>

          {/* Close only after import succeeds; keep open on validation errors */}
          {onImport ? (
            <Button onClick={handleImport} disabled={!file || !!error || isImporting}>
              {isImporting ? 'Importing…' : 'Import'}
            </Button>
          ) : (
            <DialogClose asChild>
              <Button disabled={!file || !!error}>Import</Button>
            </DialogClose>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
