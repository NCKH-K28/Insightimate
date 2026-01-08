import React from 'react';
import { MoreHorizontal, FileText, File } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { activities } from '@/lib/data';

export function ActivityStream() {
  return (
    <Card className='h-full'>
      <CardHeader className='flex flex-row items-center justify-between pb-4'>
        <CardTitle className='text-base font-semibold'>Activity stream</CardTitle>
        <Button variant='ghost' size='icon' className='h-8 w-8'>
          <MoreHorizontal className='h-4 w-4 text-muted-foreground' />
        </Button>
      </CardHeader>
      <CardContent>
        <div className='relative pl-4 border-l border-muted space-y-8'>
          {activities.map((activity) => (
            <div key={activity.id} className='relative pl-4'>
              {/* Dot on line */}
              <div className='absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-slate-400'></div>

              <div className='flex flex-col gap-1 mb-2'>
                <div className='flex items-center justify-between'>
                  <h4 className='text-sm font-medium text-foreground'>{activity.title}</h4>
                </div>
                <p className='text-sm text-muted-foreground'>
                  {activity.description}
                  {activity.files && (
                    <span className='ml-1 text-blue-500 hover:underline cursor-pointer'>FD-7</span>
                  )}
                  {activity.tags &&
                    activity.tags.map((tag) => (
                      <Badge
                        key={tag.label}
                        variant={tag.color as any}
                        className='ml-2 h-5 rounded px-1.5'
                      >
                        {tag.label}
                      </Badge>
                    ))}
                  {activity.images && (
                    <span className='ml-1 text-blue-500 hover:underline cursor-pointer'>
                      Payments
                    </span>
                  )}
                </p>
              </div>

              {/* Attachments */}
              {activity.files && (
                <div className='flex flex-wrap gap-3 mt-3'>
                  {activity.files.map((file, i) => (
                    <div
                      key={i}
                      className='flex items-center gap-3 p-2 border rounded-lg bg-muted/30 min-w-[160px]'
                    >
                      <div className='h-8 w-8 bg-white rounded flex items-center justify-center border shadow-sm text-green-600'>
                        <FileText className='h-4 w-4' />
                      </div>
                      <div className='flex flex-col'>
                        <span className='text-xs font-medium truncate max-w-[100px]'>
                          {file.name}
                        </span>
                        <span className='text-[10px] text-muted-foreground'>{file.size}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Images Preview */}
              {activity.images && (
                <div className='flex flex-wrap gap-3 mt-3'>
                  {activity.images.map((colorClass, i) => (
                    <div
                      key={i}
                      className={`h-16 w-24 rounded-lg ${colorClass} opacity-80 hover:opacity-100 transition-opacity cursor-pointer relative`}
                    >
                      {/* Decorative dot */}
                      <div
                        className={`absolute bottom-2 right-2 h-2 w-2 rounded-full bg-black/20`}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className='mt-2 text-[11px] text-muted-foreground uppercase font-medium tracking-wide'>
                {activity.time}
              </div>
            </div>
          ))}
        </div>

        <div className='mt-8 pl-8'>
          <Button variant='link' className='px-0 text-blue-600 h-auto'>
            View more
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
