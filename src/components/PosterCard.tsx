'use client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, Clock, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { PosterStatus } from '@prisma/client';
import {
  computePosterState,
  PosterPossiblyWithCreator,
  updatePosterStatusViaApi,
  deletePosterViaApi,
} from '@/lib/posters';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toDurationParts } from '@/lib/utils';

type AssetType = 'image' | 'video' | 'other';

function getAssetType(mime: string): AssetType {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'other';
}

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

function formatDurationLabel(seconds: number) {
  const parts = toDurationParts(seconds);
  if (!parts) return '--';
  if (parts.roundedSeconds < 60) return `${parts.roundedSeconds} s`;
  return `${String(parts.minutes).padStart(2, '0')}:${String(parts.seconds).padStart(2, '0')}`;
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

function TopRightActions({ posterId, fileMime, fileSize, status, dims }: {
  posterId: number;
  fileMime: string;
  fileSize: number;
  src: string;
  status: PosterStatus;
  dims?: { w: number; h: number } | null
}) {
  const [isTogglePending, startToggleTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const canToggle = status !== PosterStatus.DRAFT;
  const isDisabled = status === PosterStatus.DISABLED;

  let sizeLine: string | null = null;
  if (dims) {
    const g = gcd(dims.w, dims.h);
    sizeLine = `${dims.w}×${dims.h} • ${dims.w / g}:${dims.h / g}`;
  }

  const pathname = usePathname();
  const editHref = `/dashboard/posters/${posterId}/edit?redirect=${encodeURIComponent(pathname)}`;

  const handleToggle = () => {
    if (!canToggle || isTogglePending || isDeletePending) return;
    const nextStatus = isDisabled ? PosterStatus.READY : PosterStatus.DISABLED;
    startToggleTransition(async () => {
      try {
        const result = await updatePosterStatusViaApi(posterId, nextStatus);
        if (result.ok) {
          toast.success(nextStatus === PosterStatus.READY ? 'Poster activé' : 'Poster désactivé');
          router.refresh();
        } else {
          toast.error(result.serverError ?? 'Erreur lors de la mise à jour du poster');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inattendue';
        toast.error(message);
      }
    });
  };

  const handleDelete = () => {
    if (isDeletePending) return;
    startDeleteTransition(async () => {
      try {
        const result = await deletePosterViaApi(posterId);
        if (result.ok) {
          toast.success('Poster supprimé');
          setDeleteDialogOpen(false);
          router.refresh();
        } else {
          toast.error(result.serverError ?? 'Erreur lors de la suppression du poster');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erreur inattendue';
        toast.error(message);
      }
    });
  };

  const handleDeleteDialogChange = (nextOpen: boolean) => {
    if (isDeletePending) return;
    setDeleteDialogOpen(nextOpen);
  };

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
          <Link
            href={editHref}
            className="rounded-full bg-background/70 p-1.5 backdrop-blur"
            aria-label="Éditer"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>Éditer</TooltipContent>
      </Tooltip>

      {canToggle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={isDisabled ? 'Activer' : 'Désactiver'}
              className="rounded-full bg-background/70 p-1.5 backdrop-blur"
              onClick={handleToggle}
              disabled={isTogglePending || isDeletePending}
            >
              {isDisabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{isDisabled ? 'Activer' : 'Désactiver'}</TooltipContent>
        </Tooltip>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={handleDeleteDialogChange}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <button
                type="button"
                aria-label="Supprimer"
                className="rounded-full bg-background/70 p-1.5 backdrop-blur"
                disabled={isDeletePending || isTogglePending}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Supprimer</TooltipContent>
        </Tooltip>
        <DialogContent showCloseButton={!isDeletePending}>
          <DialogHeader>
            <DialogTitle>Supprimer le poster ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le média associé sera définitivement supprimé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild disabled={isDeletePending}>
              <Button variant="outline" disabled={isDeletePending}>
                Annuler
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeletePending}
            >
              {isDeletePending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        <span>{formatDurationLabel(displayDuration)}</span>
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

function BlurBackdrop({ src, title, assetType }: { src: string; title: string; assetType: AssetType }) {
  return (
    <>
      <div
        className="absolute z-3 bg-gradient-to-b from-transparent to-black/40 w-full h-[120%] bottom-0 left-0 pointer-events-none" />
      <div className="absolute z-2 left-0 bottom-0 w-full h-full pointer-events-none">
        <div
          className="absolute z-2 w-full h-[120%] bottom-0 left-0 overflow-hidden blur-[18px] scale-x-110 scale-y-120">
          <div className="absolute z-2 bottom-0 left-0 w-full h-[85%] overflow-hidden">
            {assetType === 'image' ? <Image
              alt={title}
              src={src}
              fill
              className="object-cover"
              sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
              loading="lazy"
              unoptimized
            /> : assetType === 'video' ?
              <video
                src={src}
                aria-hidden="true"
                muted
                loop
                playsInline
                autoPlay
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover"
              /> : null}
          </div>
        </div>
      </div>
    </>
  );
}

function AssetBackground({
                           src,
                           title,
                           assetType,
                           onDimensions,
                         }: {
  src: string;
  title: string;
  assetType: AssetType;
  onDimensions?: (dims: { w: number; h: number }) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setIsLoaded(false);
  }, [src, assetType]);

  useEffect(() => {
    if (assetType !== 'video') return;

    const video = videoRef.current;
    if (!video) return;

    let isCancelled = false;

    const handleLoadedMetadata = () => {
      if (isCancelled) return;
      onDimensions?.({ w: video.videoWidth, h: video.videoHeight });
    };

    const handleCanPlay = () => {
      if (isCancelled) return;
      setIsLoaded(true);
    };

    const handleError = () => {
      if (isCancelled) return;
      setIsLoaded(true);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleCanPlay);
    video.addEventListener('error', handleError);

    video.load();
    // Ensure metadata is loaded even if autoplay is blocked
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay might be blocked; we still consider metadata events
      });
    }

    return () => {
      isCancelled = true;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.pause();
    };
  }, [assetType, onDimensions, src]);

  return (
    <div className="absolute z-1 w-full h-full">
      <div className="relative w-full h-full">
        {!isLoaded && <Skeleton className="absolute inset-0 rounded-none" />}
        {assetType === 'image' ? <Image
          alt={title}
          src={src}
          fill
          className="object-cover"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          loading="lazy"
          unoptimized
          onLoad={(event) => {
            const img = event.currentTarget;
            setIsLoaded(true);
            onDimensions?.({ w: img.naturalWidth, h: img.naturalHeight });
          }}
          onError={() => setIsLoaded(true)}
        /> : assetType === 'video' ?
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
          /> : null}
      </div>
    </div>
  );
}

function TopBar({ posterId, status, scheduledAt, deleteAt, fileMime, fileSize, src, dims }: {
  posterId: number;
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
        <TopRightActions posterId={posterId} fileMime={fileMime} fileSize={fileSize} src={src} status={status}
                         dims={dims} />
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
                         assetType,
                       }: {
  src: string;
  title: string;
  displayDuration: number;
  description?: string | null;
  username?: string | null;
  status: PosterStatus;
  createdAt: Date;
  updatedAt: Date;
  assetType: AssetType;
}) {
  return (
    <div className="absolute z-3 w-full h-full flex items-end">
      <div className="absolute w-full">
        <div className="relative z-10 w-full p-4">
          <TitleRow title={title} displayDuration={displayDuration} />
          {description && (
            <p className="mt-1 text-sm text-card-foreground/80 line-clamp-2">{description}</p>
          )}
          {username && (
            <div className="mt-3 flex items-center justify-between">
              <CreatorMeta username={username} status={status} createdAt={new Date(createdAt)}
                           updatedAt={new Date(updatedAt)} />
            </div>
          )}
        </div>
        <BlurBackdrop src={src} title={title} assetType={assetType} />
      </div>
    </div>
  );
}

export function PosterCard({ poster }: { poster: PosterPossiblyWithCreator; }) {
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
  const assetType = getAssetType(fileMime);
  const [assetDims, setAssetDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setAssetDims(null);
  }, [assetType, src]);

  const handleAssetDimensions = useCallback((dims: { w: number; h: number }) => {
    setAssetDims(dims);
  }, []);

  return (
    <div className="relative w-full h-full aspect-square overflow-hidden z-2 rounded-xl">
      <AssetBackground
        src={src}
        title={title}
        assetType={assetType}
        onDimensions={handleAssetDimensions}
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
        assetType={assetType}
      />
      <TopBar
        posterId={poster.id}
        status={status}
        scheduledAt={scheduledAt}
        deleteAt={deleteAt}
        fileMime={fileMime}
        fileSize={fileSize}
        src={src}
        dims={assetDims}
      />
    </div>
  );
}
