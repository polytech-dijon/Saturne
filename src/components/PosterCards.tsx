import { PosterCard } from '@/components/PosterCard';
import React from 'react';
import { PosterWithCreator } from '@/lib/posters';

export function PosterCards({ posters }: { posters: PosterWithCreator[] }) {
  return (
    <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6">
      {posters.length === 0 ? (
        <p className="text-muted-foreground">Aucun poster pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
          {posters.map((poster) => (
            <PosterCard key={poster.id} poster={poster} />
          ))}
        </div>
      )}
    </div>
  );
}
