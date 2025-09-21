'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PosterCard } from '@/components/PosterCard';
import { PosterPossiblyWithCreator, PosterState, computePosterState } from '@/lib/posters';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ImagePlus } from 'lucide-react';

interface CreatorSummary {
  id: number;
  username: string;
}

type PosterKind = 'IMAGE' | 'VIDEO' | 'OTHER';

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function getPosterKind(fileMime: string): PosterKind {
  if (fileMime.startsWith('image/')) return 'IMAGE';
  if (fileMime.startsWith('video/')) return 'VIDEO';
  return 'OTHER';
}

const stateLabels: Record<PosterState, string> = {
  DRAFT: 'Brouillon',
  DISABLED: 'Désactivé',
  SCHEDULED: 'Planifié',
  PUBLISHED: 'Publié',
  EXPIRED: 'Expiré',
};

const kindLabels: Record<PosterKind, string> = {
  IMAGE: 'Images',
  VIDEO: 'Vidéos',
  OTHER: 'Autres',
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(String(value));
}

function FilterControls({
                          availableCreators,
                          rawSearchTerm,
                          setRawSearchTerm,
                          stateFilter,
                          setStateFilter,
                          kindFilter,
                          setKindFilter,
                          creatorFilter,
                          setCreatorFilter,
                        }: {
  availableCreators: CreatorSummary[];
  rawSearchTerm: string;
  setRawSearchTerm: (v: string) => void;
  stateFilter: 'ALL' | PosterState;
  setStateFilter: (v: 'ALL' | PosterState) => void;
  kindFilter: 'ALL' | PosterKind;
  setKindFilter: (v: 'ALL' | PosterKind) => void;
  creatorFilter: 'ALL' | string;
  setCreatorFilter: (v: 'ALL' | string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="poster-search">Rechercher</Label>
        <Input
          id="poster-search"
          type="search"
          placeholder={availableCreators.length > 1 ? 'Nom, description ou auteur' : 'Nom ou description'}
          value={rawSearchTerm}
          onChange={(event) => setRawSearchTerm(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="poster-state">Statut</Label>
        <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as 'ALL' | PosterState)}>
          <SelectTrigger id="poster-state" className="h-9 w-full">
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            {Object.entries(stateLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="poster-kind">Format</Label>
        <Select value={kindFilter} onValueChange={(value) => setKindFilter(value as 'ALL' | PosterKind)}>
          <SelectTrigger id="poster-kind" className="h-9 w-full">
            <SelectValue placeholder="Tous les formats" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les formats</SelectItem>
            {Object.entries(kindLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {availableCreators.length > 1 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="poster-creator">Auteur</Label>
          <Select value={creatorFilter} onValueChange={(value) => setCreatorFilter(value)}>
            <SelectTrigger id="poster-creator" className="h-9 w-full">
              <SelectValue placeholder="Tous les auteurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les auteurs</SelectItem>
              {availableCreators.map(({ id, username }) => (
                <SelectItem key={id} value={String(id)}>
                  {username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function ResultsMetaBar({
                          count,
                          hasActiveFilters,
                          onReset,
                        }: {
  count: number;
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <span className="text-sm text-muted-foreground" aria-live="polite">
        {count} poster{count > 1 ? 's' : ''} affiché{count > 1 ? 's' : ''}
      </span>
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          Réinitialiser
        </Button>
      )}
    </div>
  );
}

function EmptyFirstPoster() {
  const pathname = usePathname();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <ImagePlus className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Créez votre premier poster</h2>
      <p className="mt-1 text-sm text-muted-foreground">Ajoutez une image ou une vidéo pour commencer à publier.</p>
      <div className="mt-4">
        <Button asChild>
          <Link href={`/dashboard/posters/new?redirect=${encodeURIComponent(pathname)}`}>Nouveau poster</Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyNoResults({ onReset }: { onReset: () => void }) {
  return (
    <div
      className="flex items-center justify-between rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      <span>
        Aucun résultat. <span className="hidden sm:inline">Essayez d’élargir vos filtres.</span>
      </span>
      <Button variant="secondary" size="sm" onClick={onReset}>
        Réinitialiser
      </Button>
    </div>
  );
}

function PostersGrid({ posters }: { posters: PosterPossiblyWithCreator[] }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:gap-6', 'sm:grid-cols-2 xl:grid-cols-3')}>
      {posters.map((poster) => (
        <PosterCard key={poster.id} poster={poster} />
      ))}
    </div>
  );
}

export function PosterCards({ posters }: { posters: PosterPossiblyWithCreator[] }) {
  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const searchTerm = useDebouncedValue(rawSearchTerm, 250);
  const [stateFilter, setStateFilter] = useState<'ALL' | PosterState>('ALL');
  const [kindFilter, setKindFilter] = useState<'ALL' | PosterKind>('ALL');
  const [creatorFilter, setCreatorFilter] = useState<'ALL' | string>('ALL');

  const enhancedPosters = useMemo(() => {
    return posters.map((poster) => {
      const scheduledAt = toDate(poster.scheduledAt);
      const deleteAt = toDate(poster.deleteAt);
      const state = computePosterState({
        status: poster.status,
        scheduledAt,
        deleteAt,
      });
      return {
        poster,
        state,
        kind: getPosterKind(poster.fileMime),
      };
    });
  }, [posters]);

  const availableCreators = useMemo<CreatorSummary[]>(() => {
    const seen = new Map<number, string>();
    for (const { poster } of enhancedPosters) {
      if (poster.creator) {
        seen.set(poster.creator.id, poster.creator.username);
      }
    }
    return Array.from(seen.entries()).map(([id, username]) => ({ id, username }));
  }, [enhancedPosters]);

  const filteredPosters = useMemo(() => {
    const normalizedSearch = (rawSearchTerm === '' ? '' : searchTerm).trim().toLowerCase();
    return enhancedPosters
      .filter(({ poster, state, kind }) => {
        if (stateFilter !== 'ALL' && state !== stateFilter) return false;
        if (kindFilter !== 'ALL' && kind !== kindFilter) return false;
        if (creatorFilter !== 'ALL') {
          if (!poster.creator || String(poster.creator.id) !== creatorFilter) return false;
        }
        if (normalizedSearch) {
          const haystack = [
            poster.title,
            poster.description ?? '',
            poster.creator?.username ?? '',
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(normalizedSearch)) return false;
        }
        return true;
      })
      .map(({ poster }) => poster);
  }, [enhancedPosters, searchTerm, rawSearchTerm, stateFilter, kindFilter, creatorFilter]);

  const hasActiveFilters = useMemo(() => {
    return (
      rawSearchTerm.trim() !== '' ||
      stateFilter !== 'ALL' ||
      kindFilter !== 'ALL' ||
      creatorFilter !== 'ALL'
    );
  }, [rawSearchTerm, stateFilter, kindFilter, creatorFilter]);

  const resetFilters = () => {
    setRawSearchTerm('');
    setStateFilter('ALL');
    setKindFilter('ALL');
    setCreatorFilter('ALL');
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6">
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card/40 p-4 shadow-sm backdrop-blur">
        <FilterControls
          availableCreators={availableCreators}
          rawSearchTerm={rawSearchTerm}
          setRawSearchTerm={setRawSearchTerm}
          stateFilter={stateFilter}
          setStateFilter={setStateFilter}
          kindFilter={kindFilter}
          setKindFilter={setKindFilter}
          creatorFilter={creatorFilter}
          setCreatorFilter={setCreatorFilter}
        />
        <ResultsMetaBar count={filteredPosters.length} hasActiveFilters={hasActiveFilters} onReset={resetFilters} />
      </div>

      {posters.length === 0 ? (
        <EmptyFirstPoster />
      ) : filteredPosters.length === 0 ? (
        hasActiveFilters ? <EmptyNoResults onReset={resetFilters} /> : (
          <p className="text-muted-foreground">Aucun poster pour le moment.</p>
        )
      ) : (
        <PostersGrid posters={filteredPosters} />
      )}
    </div>
  );
}
