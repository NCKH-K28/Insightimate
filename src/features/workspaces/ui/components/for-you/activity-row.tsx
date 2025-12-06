import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

type Actor = { id: string; name?: string; avatar?: string | null };

interface Props {
  title: string;
  meta: string;
  Icon: React.ComponentType<{ className?: string }>;
  action?: string;
  actors?: Actor[];
  onClick?: () => void;
  showAvatar?: boolean;
}

export function ActivityRow({ title, meta, Icon, action, actors, onClick, showAvatar = true }: Props) {
  const initials = (actors?.[0]?.name ?? title.slice(0, 2)).slice(0, 2).toUpperCase();

  const renderAvatars = () => {
    if (!actors || actors.length === 0) return (
      <Avatar className="h-8 w-8">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    );

    const maxShow = 6;
    const shown = actors.slice(0, maxShow);
    const extra = Math.max(0, actors.length - shown.length);

    return (
      <div className="flex items-center relative" style={{ minWidth: 32 }}>
        {shown.map((a, idx) => (
          <div
            key={a.id}
            style={{
              marginLeft: idx === 0 ? 0 : -10,
              zIndex: shown.length - idx,
              display: 'inline-block',
            }}
          >
            <Avatar className="h-7 w-7 overflow-hidden border border-white bg-muted">
              {a.avatar ? (
                <AvatarImage src={a.avatar || undefined} alt={a.name ?? a.id} />
              ) : (
                <AvatarFallback>{(a.name ?? a.id).slice(0, 2).toUpperCase()}</AvatarFallback>
              )}
            </Avatar>
          </div>
        ))}
        {extra > 0 && (
          <div
            className="rounded-full bg-muted text-xs flex items-center justify-center text-muted-foreground border border-white"
            style={{ width: 28, height: 28, marginLeft: -6 }}
          >
            +{extra}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/30 cursor-pointer"
      onClick={() => onClick?.()}
    >
      <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium leading-none truncate">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{meta}</p>
      </div>

      <div className="ml-auto flex items-center gap-2 justify-end">
        {action && <Badge className="h-5">{action}</Badge>}
        {showAvatar !== false && renderAvatars()}
      </div>
    </div>
  );
}

export default ActivityRow;
