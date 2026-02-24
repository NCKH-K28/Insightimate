'use client';

import React from 'react';
import { FolderKanban, Users, AlertCircle, Zap } from 'lucide-react';

import type { DashboardStats } from '@/features/organization/server/dashboard.service';

// ==================== Types ====================

type StatCardDef = {
  label: string;
  value: number | string;
  icon: React.ElementType;
  subtext: string;
  subtextColor: string;
  bgColor: string;
  iconBg: string;
  iconColor: string;
};

// ==================== Component ====================

function buildCards(stats: DashboardStats): StatCardDef[] {
  return [
    {
      label: 'ACTIVE PROJECTS',
      value: stats.projectCount,
      icon: FolderKanban,
      subtext: '↗ 8% from last month',
      subtextColor: 'text-teal-700 dark:text-teal-400',
      bgColor: 'bg-teal-50/80 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900',
      iconBg: 'bg-teal-500',
      iconColor: 'text-white',
    },
    {
      label: 'TEAM MEMBERS',
      value: stats.memberCount,
      icon: Users,
      subtext: '↕ 2 new this week',
      subtextColor: 'text-blue-700 dark:text-blue-400',
      bgColor: 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
    },
    {
      label: 'OPEN ISSUES',
      value: stats.openIssueCount,
      icon: AlertCircle,
      subtext: '⊘ 5 pending priority',
      subtextColor: 'text-orange-700 dark:text-orange-400',
      bgColor:
        'bg-orange-50/80 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900',
      iconBg: 'bg-orange-500',
      iconColor: 'text-white',
    },
    {
      label: 'EFFICIENCY',
      value: '92%',
      icon: Zap,
      subtext: '✓ Top 10% of teams',
      subtextColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor:
        'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
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
          <div
            key={card.label}
            className={`rounded-xl ${card.bgColor} p-4 sm:p-5 transition-shadow duration-200 hover:shadow-md`}
          >
            <div className='flex items-start justify-between gap-2'>
              <div className='space-y-0.5 min-w-0'>
                <p className='text-[10px] sm:text-[11px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  {card.label}
                </p>
                <p className='text-2xl sm:text-3xl font-bold tracking-tight'>
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
              </div>
              <div
                className={`size-9 sm:size-10 rounded-xl ${card.iconBg} flex items-center justify-center ${card.iconColor} shrink-0`}
              >
                <Icon className='size-4 sm:size-5' />
              </div>
            </div>
            <p className={`text-[11px] sm:text-xs mt-2 font-medium ${card.subtextColor}`}>
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
