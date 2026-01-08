'use client';

import { useMemo } from 'react';
import { useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type AvatarUploadClassNames = Partial<{
  root: string;
  wrapper: string;
  dropzone: string;
  input: string;
  image: string;
  empty: string;
  emptyIcon: string;
  removeButton: string;
  removeIcon: string;
}>;

interface AvatarUploadProps {
  maxSize?: number;
  classNames?: AvatarUploadClassNames;
  onFileChange?: (file: FileWithPreview | null) => void;
  defaultAvatar?: string;
}

export default function AvatarUpload({
  maxSize = 2 * 1024 * 1024,
  classNames,
  onFileChange,
  defaultAvatar,
}: AvatarUploadProps) {
  const [
    { files, isDragging },
    {
      removeFile,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] = useFileUpload({
    maxFiles: 1,
    maxSize,
    accept: 'image/*',
    multiple: false,
    onFilesChange: (files) => onFileChange?.(files[0] || null),
  });

  const currentFile = files[0];
  const previewUrl = currentFile?.preview || defaultAvatar;

  const handleRemove = () => {
    if (currentFile) removeFile(currentFile.id);
  };

  const inputProps = useMemo(() => getInputProps(), [getInputProps]);

  return (
    <div className={cn('flex flex-col items-center gap-4', classNames?.root)}>
      <div className={cn('relative', classNames?.wrapper)}>
        <div
          className={cn(
            'group/avatar relative h-24 w-24 cursor-pointer overflow-hidden rounded-full border border-dashed transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/20',
            previewUrl && 'border-solid',
            classNames?.dropzone,
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input {...inputProps} className={cn('sr-only', classNames?.input)} />

          {previewUrl ? (
            <img
              src={previewUrl}
              alt='Avatar'
              className={cn('h-full w-full object-cover', classNames?.image)}
            />
          ) : (
            <div
              className={cn('flex h-full w-full items-center justify-center', classNames?.empty)}
            >
              <User className={cn('size-6 text-muted-foreground', classNames?.emptyIcon)} />
            </div>
          )}
        </div>

        {currentFile && (
          <Button
            type='button'
            size='icon'
            variant='outline'
            onClick={(e) => {
              e.stopPropagation();
              handleRemove();
            }}
            className={cn('absolute end-0 top-0 size-6 rounded-full', classNames?.removeButton)}
            aria-label='Remove avatar'
          >
            <X className={cn('size-3.5', classNames?.removeIcon)} />
          </Button>
        )}
      </div>
    </div>
  );
}
