import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type SprintDuration = '1-week' | '2-weeks' | '3-weeks' | '4-weeks' | 'custom';
export const SPRINT_DURATION_OPTIONS = [
  { value: '1-week', label: '1 Week', days: 7 },
  { value: '2-weeks', label: '2 Weeks', days: 14 },
  { value: '3-weeks', label: '3 Weeks', days: 21 },
  { value: '4-weeks', label: '4 Weeks', days: 28 },
  { value: 'custom', label: 'Custom', days: null },
] as const;

export interface DurationPresetSelectorsProps {
  value: SprintDuration;
  onValueChange: (value: SprintDuration) => void;
  disabled?: boolean;
}

export const DurationPresetSelectors: React.FC<DurationPresetSelectorsProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  return (
    <div className='space-y-2'>
      <label className='text-sm font-medium'>Duration Preset</label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className='w-full'>
          <SelectValue placeholder='Select duration preset' />
        </SelectTrigger>
        <SelectContent>
          {SPRINT_DURATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
