import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PosterStatus } from '@prisma/client';
import { parsePosterId, PosterRouteParams, requireAuthenticatedUser } from '@/app/api/posters/_shared';

export const runtime = 'nodejs';

type StatusPayload = {
  status?: PosterStatus | string;
};

export async function PATCH(req: NextRequest, { params }: { params: PosterRouteParams }) {
  const idResult = await parsePosterId(params);
  if (idResult instanceof NextResponse) return idResult;
  const id = idResult;

  const authContext = await requireAuthenticatedUser();
  if (authContext instanceof NextResponse) return authContext;
  const { userId, isAdmin } = authContext;

  let payload: StatusPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
  }

  const requestedStatus = typeof payload.status === 'string' ? payload.status.toUpperCase() : undefined;
  const allowedStatuses: PosterStatus[] = [PosterStatus.READY, PosterStatus.DISABLED];
  const nextStatus = allowedStatuses.find((status) => status === requestedStatus as PosterStatus);

  if (!nextStatus) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
  }

  const poster = await prisma.poster.findUnique({
    where: { id },
    select: { createdBy: true, status: true },
  });

  if (!poster) {
    return NextResponse.json({ error: 'Poster introuvable' }, { status: 404 });
  }

  if (!isAdmin && poster.createdBy !== userId) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  if (poster.status === PosterStatus.DRAFT) {
    return NextResponse.json({ error: 'Impossible de modifier un brouillon' }, { status: 400 });
  }

  if (poster.status === nextStatus) {
    return NextResponse.json({ id, status: poster.status }, { status: 200 });
  }

  try {
    const updated = await prisma.poster.update({
      where: { id },
      data: { status: nextStatus },
      select: { id: true, status: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
