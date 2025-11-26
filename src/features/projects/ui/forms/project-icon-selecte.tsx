import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { ChangeIconForm } from './change-icon-form';

// // TODO: move to utils
// function base64ToImgFile(base64: string, filename: string, defaultMimeType = 'image/jpeg'): File {
//   const arr = base64.split(',');
//   const mime = arr[0].match(/:(.*?);/)?.[1] || defaultMimeType;
//   const bstr = atob(arr[1]);
//   let n = bstr.length;
//   const u8arr = new Uint8Array(n);
//   while (n--) u8arr[n] = bstr.charCodeAt(n);
//   return new File([u8arr], filename, { type: mime });
// }

const AvatarFallback = (props: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    className={cn('rounded-lg border border-dashed border-gray-300 bg-gray-100', props.className)}
  ></div>
);

type ProjectIconSelectProps = {
  value?: string;
  onValueChange: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
};

const sizeMap = {
  sm: { width: 64, height: 64 },
  md: { width: 128, height: 128 },
  lg: { width: 256, height: 256 },
};

export const ProjectIconSelect = ({
  value,
  onValueChange,
  size = 'md',
  disabled,
}: ProjectIconSelectProps) => {
  const icon = value;
  const sizeValue = sizeMap[size];

  const AvatarElm = useMemo(() => {
    if (!icon) return <AvatarFallback style={sizeValue} />;
    return (
      <Image
        loading='lazy'
        priority={false}
        width={sizeValue.width}
        height={sizeValue.height}
        src={icon}
        alt='Project Icon Preview'
        className='rounded-lg object-cover'
      />
    );
  }, [icon, sizeValue]);

  return (
    <Dialog>
      <div style={sizeValue} className='relative'>
        {AvatarElm}
        <DialogTrigger asChild disabled={disabled}>
          <Button
            type='button'
            size='sm'
            variant='outline'
            className='absolute -bottom-1 -right-1 rounded-full p-0'
          >
            <Camera />
          </Button>
        </DialogTrigger>
      </div>
      <DialogContent
        className='w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto'
        aria-describedby='Change project icon'
      >
        <DialogHeader>
          <DialogTitle>Choose Project Icon</DialogTitle>
        </DialogHeader>
        <ChangeIconForm
          onchangeIcon={({ url }) => onValueChange(url)}
          icon={{ id: '1000', url: 'icons/1000.svg' }}
        />
        <DialogFooter className='flex flex-col sm:flex-row gap-2'>
          <Button variant='outline' className='w-full sm:w-auto'>
            Cancel
          </Button>
          <Button className='w-full sm:w-auto'>Select</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
