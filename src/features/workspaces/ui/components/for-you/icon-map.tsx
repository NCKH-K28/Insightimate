import {
  ExternalLink,
  LayoutGrid,
  CheckSquare,
  Star,
  Users2,
  Rocket,
  FolderKanban,
} from 'lucide-react';
import React from 'react';

export const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  Star,
  Users2,
  Rocket,
  FolderKanban,
  LayoutGrid,
  ExternalLink,
};

function createUrlIcon(url: string): React.ComponentType<{ className?: string }> {
  const UrlIcon = ({ className }: { className?: string }) =>
    React.createElement('img', {
      src: url,
      alt: '',
      className: `${className ?? ''} rounded`,
      style: { objectFit: 'cover' },
    });
  UrlIcon.displayName = 'UrlIcon';
  return UrlIcon;
}

export function resolveIcon(name?: string) {
  if (!name) return CheckSquare;

  const isUrl = typeof name === 'string' && /^(https?:\/\/|data:|\/)/i.test(name);
  if (isUrl) return createUrlIcon(name as string);

  return iconMap[name] ?? CheckSquare;
}

export default resolveIcon;
