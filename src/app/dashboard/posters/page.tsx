import React from 'react';
import prisma from '@/lib/prisma';
import { PosterCards } from '@/components/PosterCards';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();
  if (!session?.user) return redirect('/login');

  const userId = Number(session.user.id);
  if (!Number.isInteger(userId)) return redirect('/login');

  const posters = await prisma.poster.findMany({
    where: {
      createdBy: userId,
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  return (
    <PosterCards posters={posters} />
  );
}
