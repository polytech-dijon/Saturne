import React from 'react';
import prisma from '@/lib/prisma';
import { PosterCards } from '@/components/PosterCards';

export default async function Page() {
  const posters = await prisma.poster.findMany({
    include: {
      creator: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return (
    <PosterCards posters={posters} />
  );
}
