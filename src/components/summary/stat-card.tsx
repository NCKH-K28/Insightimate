'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  delta?: string;
};

export default function StatCard({ title, value, delta }: StatCardProps) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {delta && <CardDescription>{delta}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className='text-3xl font-semibold'>{value}</div>
      </CardContent>
    </Card>
  );
}
