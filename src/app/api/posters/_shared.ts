import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Role } from '@prisma/client';
import type { Session } from 'next-auth';

export type PosterRouteParams = Promise<{ id: string }>;

type AuthSuccess = {
  session: Session;
  userId: number;
  isAdmin: boolean;
};

export async function parsePosterId(params: PosterRouteParams): Promise<number | NextResponse> {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
  }
  return id;
}

export async function requireAuthenticatedUser(): Promise<AuthSuccess | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 401 });
  }

  return {
    session,
    userId,
    isAdmin: session.user.role === Role.ADMIN,
  };
}
