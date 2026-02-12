'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AxiosError } from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ZSignUpInput } from '@/contracts/auth/auth.input';
import { GoogleIcon } from '@/components/icons/google-icon';
import { FacebookIcon } from '@/components/icons/facebook-icon';
import { InsightmateLogoFull } from '@/components/icons/insightmate';
import { authClient } from '@/lib/auth-client';
import { getErrorMsg } from '@/lib/api/helper';

const ZFormData = ZSignUpInput.extend({
  confirmPassword: ZSignUpInput.shape.password,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignUpFormProps = { redirectTo?: string };

export function SignUpForm(props: SignUpFormProps) {
  const router = useRouter();
  const signUp = useMutation({
    mutationFn: async (data: Parameters<typeof authClient.signUp.email>[0]) => {
      const result = await authClient.signUp.email(data);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      if (props.redirectTo) router.push(props.redirectTo);
    },
  });

  const form = useForm({
    resolver: zodResolver(ZFormData),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await toast
      .promise(signUp.mutateAsync(data), {
        loading: 'Creating your account.. .',
        success: 'Account created successfully!  You can now sign in.',
        error: (err) => getErrorMsg(err),
      })
      .unwrap()
      .then(() => {
        form.reset();
        if (props.redirectTo) router.push(props.redirectTo);
      });
  });

  return (
    <div className='flex flex-col gap-6'>
      {/* Logo */}
      <div className='flex justify-center'>
        <Link href='/'>
          <InsightmateLogoFull height={40} />
          <span className='sr-only'>Insightmate</span>
        </Link>
      </div>

      <Card className='w-full max-w-md mx-auto'>
        <CardHeader className='space-y-4'>
          {/* Title + Description */}
          <div className='space-y-1 text-center'>
            <CardTitle className='text-2xl font-semibold'>Sign up</CardTitle>
            <CardDescription>Create your Insightmate account to get started</CardDescription>
          </div>
        </CardHeader>

        <CardContent className='flex flex-col gap-2'>
          {/* Email/Password Form */}
          <Form {...form}>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your full name'
                        type='text'
                        autoComplete={`user. ${field.name}`}
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter your email'
                        type='email'
                        autoComplete={`user. ${field.name}`}
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Create a password'
                        type={'password'}
                        autoComplete={`user.${field.name}`}
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Confirm your password'
                        type='password'
                        disabled={form.formState.isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type='submit'
                className='w-full'
                disabled={form.formState.isSubmitting || !form.formState.isValid}
              >
                {form.formState.isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {form.formState.isSubmitting ? 'Signing up...' : 'Sign Up with Email'}
              </Button>
            </form>
          </Form>

          {/* Divider */}
          <div className='relative my-2'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>
                Or continue with Email
              </span>
            </div>
          </div>

          {/* Social Sign Up Buttons */}
          <div className='grid grid-cols-2 gap-3'>
            <Button
              type='button'
              variant='outline'
              size='lg'
              disabled={form.formState.isSubmitting}
            >
              <GoogleIcon alt='Google Icon' className='mr-2 h-5 w-5' />
              Google
            </Button>
            <Button
              type='button'
              variant='outline'
              size='lg'
              disabled={form.formState.isSubmitting}
            >
              <FacebookIcon alt='Facebook Icon' className='mr-2 h-5 w-5' />
              Facebook
            </Button>
          </div>
        </CardContent>
        <CardFooter>
          <div className='text-sm text-center text-muted-foreground w-full'>
            Already have an account?{' '}
            <Link href='/signin' className='text-primary hover:underline font-medium'>
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default SignUpForm;
