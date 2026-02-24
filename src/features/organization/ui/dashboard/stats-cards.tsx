'use client';

import React from 'react';
import { FolderKanban, Users, CircleDot, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import type { DashboardStats } from '@/features/organization/server/dashboard.service';

// ==================== Types ====================

type StatCardDef = {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
};

// ==================== Component ====================

function buildCards(stats: DashboardStats): StatCardDef[] {
  return [
    {
      label: 'Projects',
      value: stats.projectCount,
      icon: FolderKanban,
      gradient: 'from-blue-500/10 to-blue-500/5',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Members',
      value: stats.memberCount,
      icon: Users,
      gradient: 'from-emerald-500/10 to-emerald-500/5',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'Open Issues',
      value: stats.openIssueCount,
      icon: CircleDot,
      gradient: 'from-amber-500/10 to-amber-500/5',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Activity (7d)',
      value: stats.activityCount7d,
      icon: Activity,
      gradient: 'from-violet-500/10 to-violet-500/5',
      iconColor: 'text-violet-500',
    },
  ];
}

type StatsCardsProps = {
  stats: DashboardStats;
};

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = buildCards(stats);

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className={`bg-linear-to-br ${card.gradient} border-0 shadow-sm hover:shadow-md transition-shadow duration-200`}
          >
            <CardContent className='p-5'>
              <div className='flex items-center justify-between'>
                <div className='space-y-1'>
                  <p className='text-xs font-medium text-muted-foreground uppercase tracking-wider'>
                    {card.label}
                  </p>
                  <p className='text-2xl font-bold tracking-tight'>{card.value.toLocaleString()}</p>
                </div>
                <div
                  className={`size-10 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center ${card.iconColor}`}
                >
                  <Icon className='size-5' />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
