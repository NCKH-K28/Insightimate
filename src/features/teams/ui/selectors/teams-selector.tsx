import React, { useMemo } from 'react';
import { listTeamsQueryOptions } from '@/features/teams/api/actionts';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Team = { id: string; name: string; lead?: string };

export type TeamsSelectorProps = {
  defaultTeam?: Team | null;
  excludeTeamIds?: string[];
  onSelect?: (team: Team | null) => void;

  params?: { workspaceId?: string };
  className?: string;
};

export const TeamsSelector = ({
  onSelect,
  excludeTeamIds,
  defaultTeam,
  className,
}: TeamsSelectorProps) => {
  const pathname = usePathname();

  const teamsPath = useMemo(() => {
    const pathParts = pathname.split('/');
    const workspaceId = pathParts[2];
    return `/wps/${workspaceId}/teams`;
  }, [pathname]);

  const [selectTeam, setSelectTeam] = React.useState<Team | null>(defaultTeam || null);

  const excludeTeamIdsSet = new Set(excludeTeamIds);

  const { data: teams, isPending: isTeamsPending } = useQuery(listTeamsQueryOptions());

  const filteredTeams = teams?.filter((team) => !excludeTeamIdsSet.has(team.id)) || [];

  const handleValueChange = (value: string) => {
    const team = filteredTeams.find((t) => t.id === value) || null;
    setSelectTeam(team);
    onSelect?.(team);
  };

  return (
    <Select value={selectTeam?.id} onValueChange={handleValueChange}>
      <SelectTrigger className={className} disabled={isTeamsPending}>
        {isTeamsPending ? (
          <div className='flex items-center space-x-2'>
            <Loader2Icon className='size-4 animate-spin' />
            <span>Loading teams...</span>
          </div>
        ) : (
          <SelectValue placeholder='Select a team' />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Teams</SelectLabel>
          {filteredTeams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectGroup>
        <Button size='sm' asChild variant='outline' className='w-full mt-1'>
          <Link href={`${teamsPath}`}>Manage Teams</Link>
        </Button>
      </SelectContent>
    </Select>
  );
};
