'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface CoverImagePickerProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function CoverImagePicker({ value, onChange, disabled }: CoverImagePickerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        onChange(data.url);
        setIsOpen(false);
      }
    } catch {
      // Fallback: use object URL for preview
      onChange(URL.createObjectURL(file));
      setIsOpen(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput('');
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative h-32 w-full overflow-hidden rounded-lg border-2 border-dashed border-border/60 transition-colors',
          !value && 'hover:border-primary/40 hover:bg-muted/30',
          value && 'border-solid border-border/30',
        )}
      >
        {value ? (
          <>
            <img src={value} alt="Cover" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/0 transition-colors hover:bg-black/30">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 bg-black/40 text-white opacity-0 transition-opacity hover:bg-black/60 [*:hover>&]:opacity-100"
                onClick={() => onChange(null)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        ) : (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground"
                disabled={disabled}
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs font-medium">Add cover image</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-3" align="center">
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Upload image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>or</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Paste image URL..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  className="h-8 text-xs"
                />
                <Button size="sm" className="h-8 px-2" onClick={handleUrlSubmit}>
                  <LinkIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
