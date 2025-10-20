import { DialogFooter } from '@/components/ui/dialog';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
    FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { ZIssueStatusCreateInput } from '@/contracts/issues/issues.input';
import z from 'zod';
import React from 'react';
import { Loader2 } from 'lucide-react';

const ZFormData = ZIssueStatusCreateInput;
type FormData = z.infer<typeof ZFormData>;

export type CreateStatusFormProps = {
    onCancel?: () => void;
    onSubmit?: (data: FormData) => void | Promise<void>;
};

export const CreateStatusForm = ({ onCancel, onSubmit }: CreateStatusFormProps) => {
    const form = useForm({
        mode: 'onChange',
        resolver: zodResolver(ZFormData),
        defaultValues: {
            name: '',
            description: '',
            category: 'TODO' as const,
            color: '#6B7280',
            sequence: 0,
        },
    });

    const handleSubmit = form.handleSubmit((data) => {
        if (onSubmit) return onSubmit(data);
    });

    const handleCancel = () => {
        form.reset();
        onCancel?.();
    };

    const isSubmitting = form.formState.isSubmitting;

    return (
        <Form {...form}>
            <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Main Content Section */}
                <div className='space-y-4'>
                    <FormField
                        control={form.control}
                        name='name'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-base font-semibold'>
                                    Status Name <span className='text-destructive'>*</span>
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder='e.g., In Review, Testing, Blocked'
                                        className='h-11'
                                        autoFocus
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='category'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-base font-semibold'>
                                    Category <span className='text-destructive'>*</span>
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className='h-11'>
                                            <SelectValue placeholder='Select a category' />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value='TODO'>To Do</SelectItem>
                                        <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
                                        <SelectItem value='DONE'>Done</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    Category determines which column this status belongs to
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name='description'
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className='text-base font-semibold'>Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder='Add a description for this status...'
                                        className='min-h-[100px] resize-none'
                                        {...field}
                                        value={field.value ?? ''}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className='grid grid-cols-2 gap-4'>
                        <FormField
                            control={form.control}
                            name='color'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-base font-semibold'>Color</FormLabel>
                                    <FormControl>
                                        <div className='flex items-center gap-2'>
                                            <Input
                                                type='color'
                                                className='h-11 w-16 cursor-pointer'
                                                {...field}
                                                value={field.value ?? '#6B7280'}
                                            />
                                            <Input
                                                type='text'
                                                className='h-11 flex-1'
                                                placeholder='#6B7280'
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='sequence'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className='text-base font-semibold'>Order</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='number'
                                            min={0}
                                            className='h-11'
                                            placeholder='0'
                                            {...field}
                                            value={field.value ?? 0}
                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                
                {/* Action Buttons */}
                <DialogFooter className='gap-2 sm:gap-0'>
                    <div className='flex justify-end items-center gap-2 w-full'>
                        <Button
                            variant='ghost'
                            type='button'
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type='submit'
                            disabled={isSubmitting}
                            className='min-w-[100px]'
                        >
                            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                            {isSubmitting ? 'Creating...' : 'Create Status'}
                        </Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
    );
};
