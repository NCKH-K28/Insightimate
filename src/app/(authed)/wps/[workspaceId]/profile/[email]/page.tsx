'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getMeQueryOptions } from '@/features/authn/api/actions';
import axiosInstance from '@/lib/api/_client';

// ============ Constants ============
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// ============ Schema ============
const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  avatar: z.string().nullish(),
  phone: z.string().max(20).nullable(),
  bio: z.string().max(160).nullable(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// ============ API ============
const api = {
  getUploadURL: async (file: File) => {
    const path = '/avatar/upload-url';
    const { data } = await axiosInstance.post(path, {
      filename: file.name,
      mediaType: file.type,
      size: file.size,
    });
    return data as { url: string; key: string };
  },

  uploadFile: (url: string, file: File) => {
    return fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
  },

  updateProfile: async (data: ProfileFormData) => {
    const res = await axiosInstance.patch('/v2/auth/me', data);
    return res.data;
  },
};

// ============ Helpers ============
const validateFile = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Please upload a JPG, PNG or GIF image';
  if (file.size > MAX_FILE_SIZE) return 'File size must be less than 5MB';
  return null;
};

const getInitial = (name?: string | null) => name?.charAt(0)?.toUpperCase() ?? 'U';

// ============ Components ============
const LoadingSpinner = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <Loader2 className={`animate-spin text-muted-foreground ${className}`} />
);

const AvatarUpload = ({
  avatar,
  name,
  isUploading,
  onUpload,
  onRemove,
}: {
  avatar: string | null;
  name: string | null;
  isUploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className='flex items-center gap-4'>
      <div className='relative'>
        <Avatar className='w-20 h-20'>
          <AvatarImage src={avatar ?? undefined} alt={name ?? 'Avatar'} />
          <AvatarFallback className='text-lg'>{getInitial(name)}</AvatarFallback>
        </Avatar>
        {avatar && (
          <Button
            type='button'
            variant='destructive'
            size='icon'
            className='absolute -top-2 -right-2 w-6 h-6 rounded-full'
            onClick={onRemove}
            disabled={isUploading}
          >
            <X className='w-3 h-3' />
          </Button>
        )}
      </div>
      <div>
        <input
          ref={inputRef}
          type='file'
          accept={ALLOWED_TYPES.join(',')}
          onChange={onUpload}
          className='hidden'
        />
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? (
            <LoadingSpinner className='w-4 h-4 mr-2' />
          ) : (
            <Upload className='w-4 h-4 mr-2' />
          )}
          {isUploading ? 'Uploading...' : 'Upload Photo'}
        </Button>
        <p className='text-xs text-muted-foreground mt-1'>JPG, PNG or GIF. Max 2MB.</p>
      </div>
    </div>
  );
};

// ============ Main Component ============
export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: me, isPending } = useQuery(getMeQueryOptions());

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', avatar: null, phone: null, bio: null },
  });

  const mutation = useMutation({
    mutationFn: api.updateProfile,
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (e) => toast.error(`Failed to update profile: ${e.message}`),
  });

  useEffect(() => {
    if (me) {
      form.reset({
        name: me.name ?? '',
        avatar: me.avatar ?? null,
        phone: me.phone ?? null,
        bio: me.bio ?? null,
      });
      setAvatarPreview(me.avatar ?? null);
    }
  }, [me, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) return toast.error(error);

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploading(true);

    try {
      const { url, key } = await api.getUploadURL(file);
      await api.uploadFile(url, file);
      form.setValue('avatar', `/api/avatar/${key}`, { shouldDirty: true });
      toast.success('Avatar uploaded successfully');
    } catch {
      toast.error('Failed to upload avatar');
      setAvatarPreview(me?.avatar ?? null);
      form.setValue('avatar', me?.avatar ?? null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    form.setValue('avatar', null, { shouldDirty: true });
  };

  const handleReset = () => {
    form.reset();
    setAvatarPreview(me?.avatar ?? null);
  };

  if (isPending) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <LoadingSpinner />
      </div>
    );
  }

  const displayAvatar = avatarPreview ?? form.watch('avatar');
  const displayName = form.watch('name');
  const canSubmit = !mutation.isPending && form.formState.isDirty;

  return (
    <div className='container mx-auto max-w-2xl py-8'>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your public profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
              className='space-y-6'
            >
              <FormField
                control={form.control}
                name='avatar'
                render={() => (
                  <FormItem>
                    <FormLabel>Avatar</FormLabel>
                    <AvatarUpload
                      avatar={displayAvatar ?? null}
                      name={displayName}
                      isUploading={isUploading}
                      onUpload={handleImageUpload}
                      onRemove={handleRemoveAvatar}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Your name' {...field} />
                    </FormControl>
                    <FormDescription>This is your public display name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        type='tel'
                        placeholder='+1 (555) 000-0000'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='bio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Tell us about yourself...'
                        className='resize-none'
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description for your profile. Max 160 characters.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex justify-end gap-2 pt-4'>
                <Button type='button' variant='outline' onClick={handleReset} disabled={!canSubmit}>
                  Cancel
                </Button>
                <Button type='submit' disabled={!canSubmit}>
                  {mutation.isPending && <LoadingSpinner className='w-4 h-4 mr-2' />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
