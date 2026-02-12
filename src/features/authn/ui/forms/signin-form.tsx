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

import { useRouter } from 'next/navigation';
import { ZSignInInput } from '@/contracts/auth/auth.input';

import { GoogleIcon } from '@/components/icons/google-icon';
import { FacebookIcon } from '@/components/icons/facebook-icon';
import { InsightmateLogoFull } from '@/components/icons/insightmate';
import { authClient } from '@/lib/auth-client';
import { useMutation } from '@tanstack/react-query';
import { getErrorMsg } from '@/lib/api/helper';

const ZFormData = ZSignInInput;

type SignInFormProps = { redirectTo?: string };

export function SignInForm(props: SignInFormProps) {
  const router = useRouter();
  const signIn = useMutation({
    mutationFn: async (data: Parameters<typeof authClient.signIn.email>[0]) => {
      const result = await authClient.signIn.email(data);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      if (props.redirectTo) router.push(props.redirectTo);
    },
  });

  const form = useForm({
    resolver: zodResolver(ZFormData),
    defaultValues: { email: '', password: '' },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await toast.promise(signIn.mutateAsync(data), { error: (err) => getErrorMsg(err) }).unwrap();
  });

  const handleGoogleSignIn = () => {
    console.log('Google sign in clicked');
  };

  const handleFacebookSignIn = () => {
    console.log('Facebook sign in clicked');
  };

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
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl font-bold text-center'>Welcome back</CardTitle>
          <CardDescription className='text-center'>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-2'>
          {/* Email/Password Form */}
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
              onClick={handleGoogleSignIn}
              disabled={form.formState.isSubmitting}
            >
              <GoogleIcon alt='Google Icon' className='mr-2 h-5 w-5' />
              Google
            </Button>
            <Button
              type='button'
              variant='outline'
              size='lg'
              onClick={handleFacebookSignIn}
              disabled={form.formState.isSubmitting}
            >
              <FacebookIcon alt='Facebook Icon' className='mr-2 h-5 w-5' />
              Facebook
            </Button>
          </div>
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
    </div>
  );
}

export default SignInForm;
