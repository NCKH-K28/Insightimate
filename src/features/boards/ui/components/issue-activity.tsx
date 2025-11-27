'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommentList from './comment-list-issue';

export default function IssueActivity({ issueId }: { issueId: string }) {
  return (
    <Tabs defaultValue='checklist' className='w-full'>
      <TabsList>
        <TabsTrigger value='comments'>Comments</TabsTrigger>
      </TabsList>
      <TabsContent value='comments'>
        <CommentList issueId={issueId} />
      </TabsContent>
    </Tabs>
  );
}
