import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { MoreHorizontal, Info, Clock } from 'lucide-react';
import { Poster, PosterStatus } from '@prisma/client';
import { computePosterState } from '@/lib/posters';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const u = ['KB', 'MB', 'GB', 'TB'];
  let i = -1;
  do {
    n /= 1024;
    i++;
  } while (n >= 1024 && i < u.length - 1);
  return `${n.toFixed(1)} ${u[i]}`;
}

export function PosterCard({ poster, creator }: { poster: Poster, creator: { username: string, id: number } }) {
  const {
    title, description, fileMime, fileSize,
    scheduledAt, deleteAt, displayDuration,
    status, createdAt, updatedAt,
  } = poster;
  const src = `/api/posters/${poster.id}`;
  const isVideo = fileMime.startsWith('video/');
  const computed = computePosterState({ status, scheduledAt, deleteAt });

  const statusBadge = {
    DRAFT: <Badge variant="secondary">Brouillon</Badge>,
    DISABLED: <Badge variant="outline">Désactivé</Badge>,
    SCHEDULED: <Badge>Planifié</Badge>,
    PUBLISHED: <Badge variant="default">Publié</Badge>,
    EXPIRED: <Badge variant="outline">Expiré</Badge>,
  }[computed];

  return (
    <div className="rounded-2xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      {/* cover */}
      <div className="relative aspect-[16/9] bg-muted">
        {isVideo ? (
          <video src={src} controls playsInline className="h-full w-full object-cover" />
        ) : (
          <img src={src} alt={title} className="h-full w-full object-cover" />
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {statusBadge}
          {scheduledAt && new Date(scheduledAt) > new Date() && (
            <Badge
              variant="outline">Débute {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(scheduledAt))}</Badge>
          )}
          {deleteAt && (
            <Badge
              variant="secondary">Expire {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(deleteAt))}</Badge>
          )}
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button aria-label="Infos fichier" className="rounded-full bg-background/70 p-1.5 backdrop-blur">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <div>{fileMime}</div>
                <div className="text-muted-foreground">{formatBytes(fileSize)}</div>
              </div>
            </TooltipContent>
          </Tooltip>
          <button className="rounded-full bg-background/70 p-1.5 backdrop-blur" aria-label="Actions">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* body */}
      <div className="p-4">
        <h3 className="text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{description}</p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback>
                {creator?.username?.slice(0, 2).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium">{creator?.username ?? '—'}</div>
              <div className="text-muted-foreground">
                {status === PosterStatus.READY ? 'publié' : 'modifié'}{' '}
                <time dateTime={(status === PosterStatus.READY ? createdAt : updatedAt).toISOString()}>
                  {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(status === PosterStatus.READY ? createdAt : updatedAt))}
                </time>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{displayDuration}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
