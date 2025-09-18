'use client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Clock, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PosterStatus } from '@prisma/client';
import { computePosterState, PosterWithCreator } from '@/lib/posters';

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

function formatDuration(s: number) {
  if (s < 60) return `${s}\u00A0s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function gcd(a: number, b: number) {
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function formatDateStr(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeZone: 'Europe/Paris' }).format(d);
}

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Europe/Paris',
  }).format(d);
}

function TopRightActions({ fileMime, fileSize, src, status, dims: dimsProp }: {
  fileMime: string;
  fileSize: number;
  src: string;
  status: PosterStatus;
  dims?: { w: number; h: number } | null
}) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(dimsProp ?? null);

  useEffect(() => {
    if (dimsProp) {
      setDims(dimsProp);
      return;
    }
    const probe = new window.Image();
    probe.onload = () => setDims({ w: probe.naturalWidth, h: probe.naturalHeight });
    probe.onerror = () => setDims(null);
    probe.src = src;
  }, [src, dimsProp]);

  const canToggle = status !== PosterStatus.DRAFT;
  const isDisabled = status === PosterStatus.DISABLED;

  let sizeLine: string | null = null;
  if (dims) {
    const g = gcd(dims.w, dims.h);
    sizeLine = `${dims.w}×${dims.h} • ${dims.w / g}:${dims.h / g}`;
  }

  return (
    <div className="flex items-center gap-2 text-card-foreground">
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
            {sizeLine && <div className="text-muted-foreground">{sizeLine}</div>}
          </div>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button aria-label="Éditer" className="rounded-full bg-background/70 p-1.5 backdrop-blur">
            <Pencil className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Éditer</TooltipContent>
      </Tooltip>

      {canToggle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label={isDisabled ? 'Activer' : 'Désactiver'}
                    className="rounded-full bg-background/70 p-1.5 backdrop-blur">
              {isDisabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isDisabled ? 'Activer' : 'Désactiver'}</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <button aria-label="Supprimer" className="rounded-full bg-background/70 p-1.5 backdrop-blur">
            <Trash2 className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Supprimer</TooltipContent>
      </Tooltip>
    </div>
  );
}

function StatusBadgesContent({ status, scheduledAt, deleteAt }: {
  status: PosterStatus;
  scheduledAt: Date | null;
  deleteAt: Date | null;
  truncateRange?: boolean;
}) {
  const computed = computePosterState({ status, scheduledAt, deleteAt });
  const statusBadge = {
    DRAFT: <Badge variant="secondary">Brouillon</Badge>,
    DISABLED: <Badge variant="outline" className="backdrop-blur-md">Désactivé</Badge>,
    SCHEDULED: <Badge>Planifié</Badge>,
    PUBLISHED: <Badge variant="default">Publié</Badge>,
    EXPIRED: <Badge variant="outline" className="backdrop-blur-md">Expiré</Badge>,
  }[computed];

  let label: string | null = null;
  switch (computed) {
    case 'EXPIRED':
      if (deleteAt) label = `Expiré le ${formatDateStr(deleteAt)}`;
      break;
    case 'PUBLISHED':
      if (deleteAt) label = `Expire le ${formatDateStr(deleteAt)}`;
      else if (scheduledAt) label = `Publié depuis le ${formatDateStr(scheduledAt)}`;
      break;
    case 'SCHEDULED':
      if (scheduledAt) label = `Débute le ${formatDateStr(scheduledAt)}`;
      break;
    default:
      label = null;
  }

  if (!label) return <span className="inline-flex">{statusBadge}</span>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{statusBadge}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function TitleRow({ title, displayDuration }: { title: string; displayDuration: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
      <div className="flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-sm backdrop-blur">
        <Clock className="h-4 w-4" />
        <span>{formatDuration(displayDuration)}</span>
      </div>
    </div>
  );
}

function CreatorMeta({ username, status, createdAt, updatedAt }: {
  username?: string | null;
  status: PosterStatus;
  createdAt: Date;
  updatedAt: Date;
}) {
  const isReady = status === PosterStatus.READY;
  const ref = isReady ? createdAt : updatedAt;
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-7 w-7 ring-1 ring-white/20">
        <AvatarFallback>{username?.slice(0, 2).toUpperCase() ?? '?'}</AvatarFallback>
      </Avatar>
      <div className="text-sm">
        <div className="font-medium">{username ?? '—'}</div>
        <div className="text-card-foreground/80">
          {isReady ? 'publié' : 'modifié'}{' '}
          <time dateTime={ref.toISOString()} title={formatDateTime(ref)}>{formatDateStr(ref)}</time>
        </div>
      </div>
    </div>
  );
}

function BlurBackdrop({ src, title }: { src: string; title: string }) {
  return (
    <>
      <div
        className="absolute z-3 bg-gradient-to-b from-transparent to-black/40 w-full h-[120%] bottom-0 left-0 pointer-events-none" />
      <div className="absolute z-2 left-0 bottom-0 w-full h-full pointer-events-none">
        <div
          className="absolute z-2 w-full h-[120%] bottom-0 left-0 overflow-hidden blur-[18px] scale-x-110 scale-y-120">
          <div className="absolute z-2 bottom-0 left-0 w-full h-[85%] overflow-hidden">
            <Image
              alt={title}
              src={src}
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              loading="lazy"
              unoptimized
            />
          </div>
        </div>
      </div>
    </>
  );
}

function BackgroundLayer({ src, title, onImageLoad }: {
  src: string;
  title: string;
  onImageLoad?: (dims: { w: number; h: number }) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute z-1 w-full h-full">
      <div className="relative w-full h-full">
        {!isLoaded && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}
        <Image
          alt={title}
          src={src}
          fill
          className="object-cover"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          loading="lazy"
          unoptimized
          onLoad={(e) => {
            const img = e.currentTarget;
            setIsLoaded(true);
            onImageLoad?.({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          onError={() => setIsLoaded(true)}
        />
      </div>
    </div>
  );
}

function TopBar({ status, scheduledAt, deleteAt, fileMime, fileSize, src, dims }: {
  status: PosterStatus;
  scheduledAt: Date | null;
  deleteAt: Date | null;
  fileMime: string;
  fileSize: number;
  src: string;
  dims?: { w: number; h: number } | null;
}) {
  return (
    <div className="absolute top-4 left-4 right-4 z-30 flex items-start justify-between gap-3 pointer-events-none">
      <div className="flex items-center gap-2 min-w-0 pointer-events-auto">
        <StatusBadgesContent status={status} scheduledAt={scheduledAt} deleteAt={deleteAt} truncateRange />
      </div>
      <div className="flex items-center gap-2 pointer-events-auto">
        <TopRightActions fileMime={fileMime} fileSize={fileSize} src={src} status={status} dims={dims} />
      </div>
    </div>
  );
}

function BottomOverlay({
                         src,
                         title,
                         displayDuration,
                         description,
                         username,
                         status,
                         createdAt,
                         updatedAt,
                         showCreator = true,
                       }: {
  src: string;
  title: string;
  displayDuration: number;
  description?: string | null;
  username?: string | null;
  status: PosterStatus;
  createdAt: Date;
  updatedAt: Date;
  showCreator?: boolean;
}) {
  return (
    <div className="absolute z-3 w-full h-full flex items-end">
      <div className="absolute w-full">
        <div className="relative z-10 w-full p-4">
          <TitleRow title={title} displayDuration={displayDuration} />
          {description && (
            <p className="mt-1 text-sm text-card-foreground/80 line-clamp-2">{description}</p>
          )}
          {showCreator && (
            <div className="mt-3 flex items-center justify-between">
              <CreatorMeta username={username} status={status} createdAt={new Date(createdAt)}
                           updatedAt={new Date(updatedAt)} />
            </div>
          )}
        </div>
        <BlurBackdrop src={src} title={title} />
      </div>
    </div>
  );
}

export function PosterCard({ poster, showCreator = true }: { poster: PosterWithCreator; showCreator?: boolean }) {
  const {
    title,
    description,
    fileMime,
    fileSize,
    scheduledAt,
    deleteAt,
    displayDuration,
    status,
    createdAt,
    updatedAt,
  } = poster;

  const src = `/api/posters/${poster.id}`;
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);

  return (
    <div className="relative w-full h-full aspect-square overflow-hidden z-2 rounded-xl">
      <BackgroundLayer
        src={src}
        title={title}
        onImageLoad={(d) => setImageDims(d)}
      />
      <BottomOverlay
        src={src}
        title={title}
        displayDuration={displayDuration}
        description={description}
        username={poster.creator?.username}
        status={status}
        createdAt={createdAt}
        updatedAt={updatedAt}
        showCreator={showCreator}
      />
      <TopBar
        status={status}
        scheduledAt={scheduledAt}
        deleteAt={deleteAt}
        fileMime={fileMime}
        fileSize={fileSize}
        src={src}
        dims={imageDims}
      />
    </div>
  );
}
