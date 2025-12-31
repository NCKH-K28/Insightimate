import React from 'react';
import { Pencil, MoreHorizontal, MapPin, Calendar, UserPlus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export function ProfileHeader(props?: { className?: string }) {
  return (
    <Card className={`p-0 overflow-hidden border-none shadow-sm ${props?.className}`}>
      {/* Banner */}
      <div className='h-48 md:h-64 relative bg-gradient-to-r from-orange-400 via-red-500 to-purple-600'>
        {/* Abstract shapes overlay for mountain effect */}
        <div className='absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/20 to-transparent'></div>
        <div className='absolute top-4 right-4'>
          <Button
            size='icon'
            variant='secondary'
            className='h-8 w-8 rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm'
          >
            <Pencil className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {/* Info Bar */}
      <div className='px-6 pb-6 pt-16 md:pt-4 relative flex flex-col md:flex-row items-center md:items-end justify-between text-center md:text-left'>
        {/* Avatar - Negative margin to pull it up */}
        <div className='absolute -top-12 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0'>
          <Avatar className='h-24 w-24 border-4 border-background shadow-md'>
            <AvatarImage src='https://i.pravatar.cc/300?u=ella' />
            <AvatarFallback className='text-xl'>EL</AvatarFallback>
          </Avatar>
        </div>

        {/* Name & Meta */}
        <div className='mt-4 md:mt-0 md:ml-32 flex-1'>
          <h1 className='text-2xl font-bold'>Ella Lauda</h1>
          <div className='flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-2'>
            <div className='flex items-center gap-1'>
              <Building2 className='h-4 w-4' />
              <span>Htmlstream</span>
            </div>
            <div className='flex items-center gap-1'>
              <MapPin className='h-4 w-4' />
              <span>San Francisco, US</span>
            </div>
            <div className='flex items-center gap-1'>
              <Calendar className='h-4 w-4' />
              <span>Joined March 2017</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className='mt-4 md:mt-0 flex items-center gap-2'>
          <Button className='gap-2'>
            <UserPlus className='h-4 w-4' />
            Connect
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>Report User</DropdownMenuItem>
              <DropdownMenuItem>Block</DropdownMenuItem>
              <DropdownMenuItem>Share Profile</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}
