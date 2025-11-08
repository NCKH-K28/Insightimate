import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export const ratingLevels = [
  { label: 'Very Low', value: 'VERY_LOW' },
  { label: 'Low', value: 'LOW' },
  { label: 'Nominal', value: 'NOMINAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Very High', value: 'VERY_HIGH' },
  { label: 'Extra High', value: 'EXTRA_HIGH' },
] as const;
export type RatingLevel = (typeof ratingLevels)[number]['value'];

type RatingLevelSelectorsProps = {
  value?: RatingLevel;
  onChange?: (value: RatingLevel) => void;
  label?: string;
  className?: string;
};
export const RatingLevelSelectors = (props: RatingLevelSelectorsProps) => {
  const { value = 'nominal', onChange, label = 'Select Rating Level', className } = props;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder='Select rating level' />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {ratingLevels.map((level) => (
            <SelectItem key={level.value} value={level.value}>
              {level.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
