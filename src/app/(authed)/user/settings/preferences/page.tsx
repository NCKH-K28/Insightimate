'use client';

import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { ZProfileUpdateInput, type ProfileUpdateInput } from '@/contracts/user/profile';
import {
  getMeProfileQueryOptions,
  updateMeProfileMutationOptions,
  userKeys,
} from '@/features/user/api/actions';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const DAYS_OF_WEEK = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'zh', label: '中文' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
];

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const TimezoneSelector = ({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}) => {
  const timezones = useMemo(() => Intl.supportedValuesOf('timeZone'), []);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className='w-full'>
        <SelectValue placeholder='Select a timezone' />
      </SelectTrigger>
      <SelectContent className='max-h-60 overflow-y-auto'>
        {timezones.map((tz) => (
          <SelectItem key={tz} value={tz}>
            {tz}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default function PreferencesSettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery(getMeProfileQueryOptions());

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(ZProfileUpdateInput) as any,
    defaultValues: {
      language: profile?.language ?? 'en',
      timezone: profile?.timezone ?? 'UTC',
      startOfWeek: profile?.startOfWeek ?? 0,
      role: profile?.role ?? '',
    },
    values: profile
      ? {
          language: profile.language ?? 'en',
          timezone: profile.timezone ?? 'UTC',
          startOfWeek: profile.startOfWeek ?? 0,
          role: profile.role ?? '',
        }
      : undefined,
    mode: 'onBlur',
  });

  const updateProfile = useMutation({
    ...updateMeProfileMutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.meProfile() });
      toast.success('Preferences updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update preferences');
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    updateProfile.mutate(data);
  });

  const isDirty = form.formState.isDirty;

  if (isLoading) {
    return (
      <Card className='max-w-2xl'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='max-w-2xl space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>
            Customize your experience with theme, language, and display preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={onSubmit} className='space-y-6'>
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role / Title</FormLabel>
                    <FormControl>
                      <Input placeholder='e.g. Software Engineer, Product Manager' {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>Your job title or role in the organization.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='language'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <FormControl>
                      <Select value={field.value ?? 'en'} onValueChange={field.onChange}>
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select language' />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='timezone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <TimezoneSelector
                        value={field.value ?? 'UTC'}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='startOfWeek'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start of Week</FormLabel>
                    <FormControl>
                      <Select
                        value={String(field.value ?? 0)}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Select start of week' />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS_OF_WEEK.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Choose which day your week starts on for calendar views.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center gap-4'>
                <Button
                  type='submit'
                  disabled={!isDirty || form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </Button>

                {isDirty && (
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => form.reset()}
                    disabled={form.formState.isSubmitting}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
