import {
  ExternalLink,
  LayoutGrid,
  CheckSquare,
  Star,
  Users2,
  Rocket,
  FolderKanban,
} from 'lucide-react';

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  Star,
  Users2,
  Rocket,
  FolderKanban,
  LayoutGrid,
  ExternalLink,
};

export function resolveIcon(name?: string) {
  if (!name) return CheckSquare;
  return iconMap[name] ?? CheckSquare;
}

export default resolveIcon;
