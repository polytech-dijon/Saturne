import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import type { PosterFormExistingAsset, PosterFormValues } from '@/components/PosterForm';
import { EditPosterForm } from '@/components/EditPosterForm';
import { PosterStatus, Role } from '@prisma/client';
import { safeRedirectPosterPath } from '@/lib/posters';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Modifier le poster',
};

export default async function EditPosterPage({ params, searchParams }: PageProps) {
  const { id: idParam } = await params;
  const posterId = Number(idParam);
  if (!Number.isFinite(posterId)) {
    return notFound();
  }

  const session = await auth();
  if (!session?.user) {
    return redirect(`/login?callbackUrl=${encodeURIComponent(`/dashboard/posters/${posterId}/edit`)}`);
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return redirect('/login');
  }
  const isAdmin = session.user.role === Role.ADMIN;

  const poster = await prisma.poster.findUnique({
    where: { id: posterId },
  });
  if (!poster || !poster.filePath) return notFound();

  if (!isAdmin && poster.createdBy !== userId) {
    return notFound();
  }

  const sp = (await searchParams) ?? {};
  const redirectParam = Array.isArray(sp.redirect) ? sp.redirect[0] : sp.redirect;
  const redirectTo = safeRedirectPosterPath(typeof redirectParam === 'string' ? redirectParam : undefined);

  const existingAsset: PosterFormExistingAsset = {
    url: `/api/posters/${poster.id}?t=${poster.updatedAt.getTime()}`,
    type: poster.fileMime.startsWith('image/')
      ? 'image'
      : poster.fileMime.startsWith('video/')
        ? 'video'
        : 'other',
    name: poster.fileName,
    size: poster.fileSize,
  };

  const initialValues: PosterFormValues = {
    title: poster.title,
    description: poster.description ?? '',
    displayDuration: poster.displayDuration,
    scheduledAt: poster.scheduledAt ? new Date(poster.scheduledAt) : undefined,
    deleteAt: poster.deleteAt ? new Date(poster.deleteAt) : undefined,
    saveAsDraft: poster.status === PosterStatus.DRAFT,
    file: null,
  };

  return (
    <EditPosterForm
      posterId={poster.id}
      initialValues={initialValues}
      redirectTo={redirectTo}
      existingAsset={existingAsset}
    />
  );
}
