import React from 'react';
import { PosterCard } from '@/components/PosterCard';
import prisma from '@/lib/prisma';

export default async function Page() {
  const posters = await prisma.poster.findMany({
    include: {
      creator: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <h1 className="text-2xl font-semibold tracking-tight">Posters</h1>

      {posters.length === 0 ? (
        <p className="text-muted-foreground">Aucun poster pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {posters.map((poster) => (
            <PosterCard key={poster.id} poster={poster} creator={poster.creator} />
          ))}
        </div>
      )}
    </div>
  );
}
