'use client';

import { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
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
import { ZSignInInput } from '@/contracts/auth/auth.input';

import { signInMutationOptions } from '../../api/actions';

const ZFormData = ZSignInInput;

type SignInFormProps = { redirectTo?: string };

export function SignInForm(props: SignInFormProps) {
  const router = useRouter();
  const signIn = useMutation(signInMutationOptions());

  const form = useForm({
    resolver: zodResolver(ZFormData),
    defaultValues: { email: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await toast
      .promise(signIn.mutateAsync(data), {
        loading: 'Signing in...',
        success: 'Signed in successfully! Redirecting...',
        error: (err) => {
          if (err instanceof AxiosError) {
            const status = err.response?.status;
            if (status === 401) return 'Invalid email or password';
            return 'An error occurred during sign in';
          }
          return 'An unexpected error occurred';
        },
      })
      .unwrap()
      .then(() => {
        if (props.redirectTo) router.push(props.redirectTo);
      });
  });

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold text-center'>Welcome back</CardTitle>
        <CardDescription className='text-center'>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className='space-y-4'>
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
                      autoComplete='email'
                      disabled={signIn.isPending}
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
                      placeholder='Enter your password'
                      type='password'
                      autoComplete='current-password'
                      disabled={signIn.isPending}
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
              {form.formState.isSubmitting ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className='flex flex-col space-y-2'>
        <div className='text-sm text-center text-muted-foreground'>
          <Link href='/forgot-password' className='text-primary hover:underline'>
            Forgot your password?
          </Link>
        </div>
        <div className='text-sm text-center text-muted-foreground'>
          Don&apos;t have an account?{' '}
          <Link href='/signup' className='text-primary hover:underline font-medium'>
            Sign up
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default SignInForm;
