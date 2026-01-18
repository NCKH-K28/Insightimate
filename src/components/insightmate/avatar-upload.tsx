'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload';
import { Button } from '@/components/ui/button';
import { User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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
  disabled?: boolean;

  /** Custom fallback when no image / image error */
  renderFallback?: (args: { disabled: boolean }) => ReactNode;
}

export default function AvatarUpload({
  maxSize = 2 * 1024 * 1024,
  classNames,
  onFileChange,
  defaultAvatar,
  disabled = false,
  renderFallback,
}: AvatarUploadProps) {
  const [imageError, setImageError] = useState(false);

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
    onFilesChange: (files) => {
      setImageError(false); // reset when file changes
      onFileChange?.(files[0] || null);
    },
  });

  const currentFile = files[0];
  const previewUrl = currentFile?.preview || defaultAvatar;
  const hasImage = Boolean(previewUrl) && !imageError;

  const handleRemove = () => {
    if (disabled) return;
    if (currentFile) removeFile(currentFile.id);
    setImageError(false);
  };

  const inputProps = useMemo(() => {
    const props = getInputProps();
    return {
      ...props,
      disabled,
      tabIndex: disabled ? -1 : props.tabIndex,
    };
  }, [getInputProps, disabled]);

  const canInteract = !disabled;

  const fallbackNode = renderFallback?.({ disabled }) ?? (
    <div className={cn('flex h-full w-full items-center justify-center', classNames?.empty)}>
      <User className={cn('size-6 text-muted-foreground', classNames?.emptyIcon)} />
    </div>
  );

  return (
    <div
      className={cn('flex flex-col items-center gap-4', classNames?.root)}
      aria-disabled={disabled}
    >
      <div className={cn('relative', classNames?.wrapper)}>
        <div
          className={cn(
            'group/avatar relative h-24 w-24 overflow-hidden rounded-full border border-dashed transition-colors',
            canInteract ? 'cursor-pointer' : 'cursor-not-allowed opacity-60',
            !disabled &&
              (isDragging
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/20'),
            previewUrl && 'border-solid',
            classNames?.dropzone,
          )}
          onDragEnter={canInteract ? handleDragEnter : undefined}
          onDragLeave={canInteract ? handleDragLeave : undefined}
          onDragOver={canInteract ? handleDragOver : undefined}
          onDrop={canInteract ? handleDrop : undefined}
          onClick={canInteract ? openFileDialog : undefined}
          role='button'
          tabIndex={canInteract ? 0 : -1}
        >
          <input {...inputProps} className={cn('sr-only', classNames?.input)} />

          {hasImage && previewUrl ? (
            <Image
              src={previewUrl}
              alt='Avatar'
              className={cn('h-full w-full object-cover', classNames?.image)}
              onError={() => setImageError(true)}
            />
          ) : (
            fallbackNode
          )}
        </div>

        {currentFile && (
          <Button
            type='button'
            size='icon'
            variant='outline'
            disabled={disabled}
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
