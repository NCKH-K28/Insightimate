'use client';

import Image from 'next/image';
import { useCallback, useState, useRef } from 'react';
import { UploadIcon, ImageIcon } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { cn } from '@/lib/utils';

type PredefinedIcon = { url: string; id?: string; name?: string };
export const PREDEFINED_ICONS: PredefinedIcon[] = [
  { id: '1000', url: '/icons/project/1000.svg' },
  { id: '1001', url: '/icons/project/1001.svg' },
  { id: '1002', url: '/icons/project/1002.svg' },
  { id: '1003', url: '/icons/project/1003.svg' },
  { id: '1004', url: '/icons/project/1004.svg' },
  { id: '1005', url: '/icons/project/1005.svg' },
  { id: '1006', url: '/icons/project/1006.svg' },
  { id: '1007', url: '/icons/project/1007.svg' },
  { id: '1008', url: '/icons/project/1008.svg' },
  { id: '1009', url: '/icons/project/1009.svg' },
  { id: '1010', url: '/icons/project/1010.svg' },
];

export const ChangeIconForm = ({
  onchangeIcon,
  icon,
}: {
  onchangeIcon?: (icon: PredefinedIcon) => void;
  icon?: PredefinedIcon;
}) => {
  const [predefinedIcons, setPredefinedIcons] = useState(PREDEFINED_ICONS);
  const [selectedIcon, setSelectedIcon] = useState<PredefinedIcon | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [tempIcon, setTempIcon] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileProcess = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const iconUrl = loadEvent.target?.result as string;
        setTempIcon(iconUrl);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleIconUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleCropComplete = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      if (!tempIcon) return;

      const canvas = document.createElement('canvas');
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.src = tempIcon;
        img.onload = () => {
          ctx.drawImage(
            img,
            croppedAreaPixels.x,
            croppedAreaPixels.y,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
            0,
            0,
            croppedAreaPixels.width,
            croppedAreaPixels.height,
          );
          const croppedIconUrl = canvas.toDataURL('image/png');
          onchangeIcon?.({ url: croppedIconUrl });
        };
      }
    },
    [tempIcon, onchangeIcon],
  );

  const resetCropper = () => {
    setTempIcon(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const handleSelectIcon = useCallback(
    (icon: PredefinedIcon) => {
      setSelectedIcon(icon);
      if (onchangeIcon) onchangeIcon(icon);
    },
    [onchangeIcon],
  );

  return (
    <div className='w-full h-full min-h-[300px]'>
      <Tabs defaultValue='choose-icon'>
        <TabsList>
          <TabsTrigger value='choose-icon'>Choose Icon</TabsTrigger>
          <TabsTrigger value='upload-icon'>Upload Icon</TabsTrigger>
        </TabsList>
        <TabsContent value='choose-icon'>
          <div className='grid grid-cols-4 gap-2'>
            {predefinedIcons.map((iconData, index) => {
              const isSelected = selectedIcon?.url === iconData.url;
              return (
                <Image
                  key={index}
                  width={128}
                  height={128}
                  src={iconData.url}
                  alt={iconData.name || 'Icon'}
                  onClick={() => handleSelectIcon(iconData)}
                  className={cn(
                    'p-1 cursor-pointer rounded-sm border-2 border-transparent',
                    isSelected ? 'border-blue-500' : '',
                  )}
                />
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value='upload-icon'>
          <div className='relative'>
            {!tempIcon && (
              <>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleFileChange}
                  className='hidden'
                />
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={cn(
                    'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                    isDragOver
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400',
                  )}
                  onClick={handleIconUpload}
                >
                  <ImageIcon className='w-12 h-12 mx-auto text-gray-400 mb-4' />
                  <p className='text-lg font-medium text-gray-700 mb-2'>Drop your icon here</p>
                  <p className='text-sm text-gray-500 mb-4'>or click to browse files</p>
                  <Button variant='outline' className='gap-2'>
                    <UploadIcon className='w-4 h-4' />
                    Choose File
                  </Button>
                </div>
              </>
            )}

            {tempIcon && (
              <div className='relative flex flex-col gap-2'>
                <div className='relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-300'>
                  <Cropper
                    image={tempIcon}
                    aspect={1}
                    crop={crop}
                    zoom={zoom}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={handleCropComplete}
                  />
                </div>

                <div className='flex gap-2'>
                  <Button variant='outline' onClick={resetCropper} className='flex-1'>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (tempIcon) onchangeIcon?.({ url: tempIcon });
                      resetCropper();
                    }}
                    className='flex-1'
                  >
                    Apply Changes
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
