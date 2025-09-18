import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { PosterCards } from '@/components/PosterCards';

export default async function AllPostersPage() {
  const session = await auth();
  if (!session?.user) return redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/all-posters')}`);
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

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
