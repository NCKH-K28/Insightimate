'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IssuesTable } from '@/features/projects/ui/import/issues-table';
import { Calculator, ClipboardList } from 'lucide-react';

export const ProjectPreviewPanel = () => {
  return (
    <Tabs defaultValue='backlog' className='py-2 size-full overflow-hidden'>
      <TabsList>
        <TabsTrigger value='backlog'>
          <ClipboardList className='size-4' />
          Backlog
        </TabsTrigger>
        <TabsTrigger value='estimation'>
          <Calculator className='size-4' />
          Estimation
        </TabsTrigger>
      </TabsList>

      <div className='size-full overflow-hidden relative'>
        <TabsContent value='backlog' className='size-full'>
          <div className='size-full absolute inset-0 z-0 overflow-hidden'>
            <IssuesTable />
          </div>
        </TabsContent>
        <TabsContent value='estimation' className='size-full'>
          <div className='size-full absolute inset-0 z-0 overflow-hidden'></div>
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default ProjectPreviewPanel;
