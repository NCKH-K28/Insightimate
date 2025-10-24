'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import React from 'react';
import AIFilesInput from './inputs/ai-files-input';

type AIInputFormProps = { params: { planId: string } };
export const AIInputForm = (props: AIInputFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Input Form</CardTitle>
        <CardDescription>Provide input for AI processing</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <AIFilesInput />
      </CardContent>
      <CardFooter>
        <Button type='submit'>Submit</Button>
      </CardFooter>
    </Card>
  );
};
