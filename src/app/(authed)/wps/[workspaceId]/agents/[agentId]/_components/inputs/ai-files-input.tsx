'use client';

import { Badge } from '@/components/ui/badge';

import { Label } from '@/components/ui/label';
import { XIcon } from 'lucide-react';
import React from 'react';
import uniqBy from 'lodash/uniqBy';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadSourceMutationOptions } from '@/features/agents/api/actions';

type AIFilesInputProps = {
  params: { agentId: string; workspaceId: string };
  onAdded?: (fileKeys: string[]) => void;
};
export const AIFilesInput = (props: AIFilesInputProps) => {
  const [uploadedFiles, setUploadedFiles] = React.useState<
    { value: string; label: string; progress?: number }[]
  >([]);

  const uploadSource = useMutation({ ...uploadSourceMutationOptions(props.params) });

  // const uploadFile = useMutation({
  //   mutationFn: async (file: File) => {
  //     const formData = new FormData();
  //     formData.append('file', file);
  //     const url = `/api/v2/agents/${props.params.agentId}/sources/upload`;
  //     const res = await axios.default.post(url, formData, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //       onUploadProgress: (progressEvent) => {
  //         const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
  //         // log
  //         console.log(`Upload progress: ${progress}%`);
  //         setUploadedFiles((prev) =>
  //           prev.map((f) => (f.value === file.name ? { ...f, progress } : f)),
  //         );
  //       },
  //     });
  //     return res.data;
  //   },
  // });

  const handleFileUpload = (file: File) => {
    toast.promise(uploadSource.mutateAsync({ file }), {
      loading: `Uploading ${file.name}...`,
      success: (data) => `Uploaded ${file.name} successfully!`,
      error: (err) => `Error uploading ${file.name}: ${err.message}`,
    });
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.docx,.pdf,.png,.jpg,.jpeg,.csv,.json,.xml,.xlsx'; // accept multiple file types
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const newFiles = Array.from(files).map((file) => ({
          value: file.webkitRelativePath || file.name,
          label: file.name,
        }));
        setUploadedFiles((prev) => uniqBy([...prev, ...newFiles], (f) => f.value));

        Array.from(files).forEach((file) => handleFileUpload(file));
      }

      input.remove();
    };
    input.click();

    //
  };

  // file drop
  return (
    <div>
      <Label htmlFor='ai-file-input' className='mb-2'>
        Upload File:
      </Label>
      <div
        className='flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted'
        onClick={handleUploadClick}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer.files;
          if (files) {
            const newFiles = Array.from(files).map((file) => ({
              value: file.webkitRelativePath || file.name,
              label: file.name,
            }));

            setUploadedFiles((prev) => uniqBy([...prev, ...newFiles], (f) => f.value));
          }
        }}
      >
        <p className='text-sm text-muted-foreground'>
          Drag and drop a file here, or click to select
        </p>
      </div>
      <div className='mt-2 flex flex-wrap gap-2'>
        {uploadedFiles.map((file) => (
          <Badge key={file.value} variant='secondary' className='relative'>
            <span
              className='cursor-pointer'
              onClick={(e) => {
                e.stopPropagation();
                setUploadedFiles((prev) => prev.filter((f) => f.value !== file.value));
              }}
            >
              <XIcon size={12} />
            </span>
            <span className='max-w-xs whitespace-nowrap overflow-hidden text-ellipsis'>
              {file.label}
            </span>
            {file.progress !== undefined && file.progress < 100 && (
              <span className='ml-2 text-xs'>({file.progress}%)</span>
            )}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default AIFilesInput;
