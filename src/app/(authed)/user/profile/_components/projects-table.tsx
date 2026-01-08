import React from 'react';
import { MoreVertical, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { projects } from '@/lib/data';

export function ProjectsTable() {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between pb-4'>
        <CardTitle className='text-base font-semibold'>Projects</CardTitle>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          <MoreVertical className='h-4 w-4 text-muted-foreground' />
        </Button>
      </CardHeader>
      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent border-b-0 text-xs uppercase'>
              <TableHead className='w-[40%] pl-6'>Project</TableHead>
              <TableHead className='w-[40%]'>Progress</TableHead>
              <TableHead className='w-[20%] text-right pr-6'>Hours Spent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((project) => (
              <TableRow key={project.id} className='border-b-0 hover:bg-muted/30'>
                <TableCell className='pl-6 py-4'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`h-9 w-9 rounded flex items-center justify-center text-sm font-semibold ${project.color}`}
                    >
                      {project.initial}
                    </div>
                    <div>
                      <p className='text-sm font-medium leading-none text-foreground'>
                        {project.name}
                      </p>
                      <p className='text-xs text-muted-foreground mt-1'>{project.updated}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className='py-4'>
                  <div className='flex items-center gap-3 max-w-[200px]'>
                    <Progress value={project.progress} className='h-1.5' />
                    <span className='text-xs text-muted-foreground w-8'>{project.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className='text-right pr-6 font-medium text-sm text-foreground py-4'>
                  {project.hours}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className='py-4 border-t flex justify-center'>
          <Button variant='ghost' size='sm' className='text-muted-foreground text-xs'>
            View all projects
            <ChevronRight className='ml-1 h-3 w-3' />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
