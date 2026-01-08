import React from 'react';
import { User, Briefcase, MapPin, Mail, Phone, Users, Layout } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

export function ProfileSidebar() {
  return (
    <div className='space-y-6'>
      {/* Completion Card */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base font-semibold'>Complete your profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center gap-4 mb-2'>
            <Progress value={82} className='h-2' />
            <span className='text-sm font-medium text-muted-foreground'>82%</span>
          </div>
        </CardContent>
      </Card>

      {/* Profile Details Card */}
      <Card>
        <CardHeader className='pb-4'>
          <CardTitle className='text-base font-semibold'>Profile</CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* About */}
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              About
            </h4>

            <div className='flex items-center gap-3 text-sm'>
              <User className='h-4 w-4 text-muted-foreground' />
              <span>Ella Lauda</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Briefcase className='h-4 w-4 text-muted-foreground' />
              <span>No department</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <div className='h-4 w-4 flex items-center justify-center'>
                <span className='text-muted-foreground text-[10px] font-bold'>~</span>
              </div>
              <span>Htmlstream</span>
            </div>
          </div>

          <Separator />

          {/* Contacts */}
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Contacts
            </h4>

            <div className='flex items-center gap-3 text-sm'>
              <Mail className='h-4 w-4 text-muted-foreground' />
              <span>ella@site.com</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Phone className='h-4 w-4 text-muted-foreground' />
              <span>+1(609) 972-22-22</span>
            </div>
          </div>

          <Separator />

          {/* Teams */}
          <div className='space-y-3'>
            <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Teams
            </h4>

            <div className='flex items-center gap-3 text-sm'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <span>Member of 7 teams</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Layout className='h-4 w-4 text-muted-foreground' />
              <span>Working on 8 projects</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
