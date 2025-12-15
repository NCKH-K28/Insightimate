'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import { Settings, Zap } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { ProjectImport } from '@/contracts/projects';
import QuickSetupTab from './tab-quick-setup';
import AdvancedSetupTab from './tab-advanced-setup';

// ================== Components ================== //

export const ProjectInfoPanel = () => {
  const form = useFormContext<ProjectImport>();
  const handleReset = () => form.reset();

  const handleClear = () => {
    form.reset();
  };

  return (
    <Tabs defaultValue='quick' className='w-full'>
      <TabsList>
        <TabsTrigger value='quick'>
          <Zap className='size-4' />
          Quick Setup
        </TabsTrigger>
        <TabsTrigger value='advanced'>
          <Settings className='size-4' />
          Advanced Setup
        </TabsTrigger>
      </TabsList>
      <div className='p-4 overflow-auto max-h-[calc(80vh-8rem)] size-full border rounded-md'>
        <TabsContent value='quick'>
          <QuickSetupTab />
        </TabsContent>
        <TabsContent value='advanced' className='mt-0'>
          <AdvancedSetupTab />
        </TabsContent>
      </div>
      <div className='mt-auto p-4 border-t border-border flex justify-end gap-2'>
        <Button size='sm' type='button' variant='ghost' onClick={handleReset}>
          Reset
        </Button>
        <Button size='sm' type='button'>
          Create Project
        </Button>
        <Button size='sm' type='button' variant='destructive' onClick={handleClear}>
          Clear All
        </Button>
      </div>
    </Tabs>
  );
};

export default ProjectInfoPanel;
