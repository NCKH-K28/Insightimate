import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Eye } from 'lucide-react';

interface ProjectSummaryHeaderProps {
  project: {
    name: string;
    key: string;
    avatar?: string | null;
    lead?: { id: string; name: string; avatar?: string | null };
  };
}

export function ProjectSummaryHeader({ project }: ProjectSummaryHeaderProps) {
  const getProjectInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='flex items-center justify-between pb-4 border-b'>
      <div className='flex items-center space-x-4'>
        {/* Project Avatar */}
        <Avatar className='h-12 w-12'>
          <AvatarImage src={project?.avatar ?? undefined} alt={project.name} />
          <AvatarFallback className='bg-blue-100 text-blue-700 font-semibold'>
            {getProjectInitials(project.name)}
          </AvatarFallback>
        </Avatar>

        <div>
          <div className='flex items-center space-x-2'>
            <h1 className='text-2xl font-semibold text-gray-900'>{project.name}</h1>
            <Badge variant='secondary' className='text-xs'>
              {project.key}
            </Badge>
          </div>

          {project.lead && (
            <div className='flex items-center space-x-2 mt-1'>
              <span className='text-sm text-gray-500'>Lead:</span>
              <Avatar className='h-5 w-5'>
                <AvatarImage src={project.lead?.avatar ?? undefined} alt={project.lead?.name} />
                <AvatarFallback className='text-xs'>
                  {project.lead?.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <span className='text-sm text-gray-700'>{project.lead.name}</span>
            </div>
          )}
        </div>
      </div>

      <div className='flex space-x-3'>
        <Button variant='outline' size='sm'>
          <Eye className='h-4 w-4 mr-2' />
          View Board
        </Button>
        <Button size='sm'>
          <Plus className='h-4 w-4 mr-2' />
          Create Issue
        </Button>
      </div>
    </div>
  );
}
