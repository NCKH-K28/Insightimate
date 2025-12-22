'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GitBranch, Timer, ArrowUpDown, ClipboardCheck, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type AgentMode = 'auto' | 'spec' | 'estimation' | 'prioritization' | 'review';

interface AgentOption {
  value: AgentMode;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const agentOptions: AgentOption[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Tự động chọn agent phù hợp',
    icon: <Sparkles className='size-4' />,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
  {
    value: 'spec',
    label: 'Spec',
    description: 'Phân tích yêu cầu & breakdown tasks',
    icon: <GitBranch className='size-4' />,
    color: 'bg-blue-500',
  },
  {
    value: 'estimation',
    label: 'Estimate',
    description: 'Ước tính story points & duration',
    icon: <Timer className='size-4' />,
    color: 'bg-green-500',
  },
  {
    value: 'prioritization',
    label: 'Priority',
    description: 'Đánh giá priority & sắp xếp backlog',
    icon: <ArrowUpDown className='size-4' />,
    color: 'bg-orange-500',
  },
  {
    value: 'review',
    label: 'Review',
    description: 'Review chất lượng task & acceptance criteria',
    icon: <ClipboardCheck className='size-4' />,
    color: 'bg-cyan-500',
  },
];

interface AgentSelectorProps {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
  disabled?: boolean;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selectedOption = agentOptions.find((o) => o.value === value) || agentOptions[0];

  return (
    <div className='flex items-center gap-1 rounded-lg bg-muted/50 p-1'>
      {agentOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all duration-200',
                  isSelected
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'flex size-5 items-center justify-center rounded text-white',
                    isSelected ? option.color : 'bg-muted-foreground/20 text-muted-foreground',
                  )}
                >
                  {option.icon}
                </span>
                <span className='hidden sm:inline'>{option.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom' sideOffset={8}>
              <div className='text-center'>
                <div className='font-medium'>{option.label}</div>
                <div className='text-xs text-muted-foreground'>{option.description}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

// Compact version for mobile
export const AgentSelectorCompact: React.FC<AgentSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const selectedOption = agentOptions.find((o) => o.value === value) || agentOptions[0];

  return (
    <div className='flex items-center gap-0.5'>
      {agentOptions.map((option) => {
        const isSelected = value === option.value;
        return (
          <Tooltip key={option.value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => !disabled && onChange(option.value)}
                disabled={disabled}
                className={cn(
                  'flex size-8 items-center justify-center rounded-md transition-all duration-200',
                  isSelected
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {option.icon}
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom' sideOffset={8}>
              <div className='text-center'>
                <div className='font-medium'>{option.label}</div>
                <div className='text-xs text-muted-foreground'>{option.description}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export { agentOptions };
