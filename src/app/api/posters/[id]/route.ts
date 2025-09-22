import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { createReadStream, statSync } from 'fs';
import path from 'path';
import { PosterStatus, Role } from '@prisma/client';
import { Readable } from 'node:stream';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { ALLOWED_MIME_PREFIXES, MAX_UPLOAD_BYTES, posterMetaSchema } from '@/lib/zod';
import { deletePosterFile, PosterFileTooLargeError, savePosterFile, type SavedPosterFile } from '@/lib/storage';
import { parsePosterId, PosterRouteParams, requireAuthenticatedUser } from '@/app/api/posters/_shared';

export const runtime = 'nodejs';
if (!process.env.UPLOAD_ROOT) throw new Error('UPLOAD_ROOT env var is not set');
const ROOT = process.env.UPLOAD_ROOT;

export async function GET(req: Request, { params }: { params: PosterRouteParams }) {
  const idResult = await parsePosterId(params);
  if (idResult instanceof NextResponse) return idResult;
  const id = idResult;

  const poster = await prisma.poster.findUnique({
    where: { id },
    select: { filePath: true, fileMime: true, createdBy: true, status: true },
  });
  if (!poster) return NextResponse.json({ error: 'Poster introuvable' }, { status: 404 });

  const session = await auth();
  const isPublished = poster.status === PosterStatus.READY;
  let allowed = false;
  if (isPublished) {
    allowed = true;
  } else if (session?.user) {
    const role = session.user.role;
    const uid = session.user.id ?? session.user?.id;
    allowed = role === Role.ADMIN || (!!uid && poster.createdBy === Number(uid));
  }
  if (!allowed) return NextResponse.json({ error: 'Accès non autorisé' }, { status: 401 });

  const abs = path.join(ROOT, poster.filePath);
  const stat = statSync(abs);
  const range = req.headers.get('range');

  const baseHeaders: Record<string, string> = {
    'Content-Type': poster.fileMime,
    'Accept-Ranges': 'bytes',
    'Cache-Control': isPublished ? 'public, max-age=3600' : 'private, max-age=0, no-store',
  };

  if (!range) {
    const nodeStream = createReadStream(abs);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;
    return new NextResponse(webStream, {
      status: 200,
      headers: { ...baseHeaders, 'Content-Length': String(stat.size) },
    });
  }

  const m = range.match(/bytes=(\d+)-(\d+)?/);
  const start = m ? parseInt(m[1], 10) : 0;
  const end = Math.min(m && m[2] ? parseInt(m[2], 10) : stat.size - 1, stat.size - 1);

  if (start >= stat.size || start > end) {
    return new NextResponse(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${stat.size}` },
    });
  }

  const chunkSize = end - start + 1;
  const nodeStream = createReadStream(abs, { start, end });
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new NextResponse(webStream, {
    status: 206,
    headers: {
      ...baseHeaders,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': String(chunkSize),
    },
  });
}

export async function PATCH(req: NextRequest, { params }: { params: PosterRouteParams }) {
  const idResult = await parsePosterId(params);
  if (idResult instanceof NextResponse) return idResult;
  const id = idResult;

  const authContext = await requireAuthenticatedUser();
  if (authContext instanceof NextResponse) return authContext;
  const { userId, isAdmin } = authContext;

  const poster = await prisma.poster.findUnique({ where: { id } });
  if (!poster) return NextResponse.json({ error: 'Poster introuvable' }, { status: 404 });

  if (!isAdmin && poster.createdBy !== userId) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  const headers = req.headers;
  const metaInput = {
    title: headers.get('x-title') || '',
    description: headers.get('x-description') || undefined,
    displayDuration: headers.get('x-display-duration') || String(poster.displayDuration),
    scheduledAt: headers.get('x-scheduled-at') || undefined,
    deleteAt: headers.get('x-delete-at') || undefined,
    saveAsDraft: headers.get('x-save-as-draft') || (poster.status === PosterStatus.DRAFT ? '1' : '0'),
  };

  const metaResult = posterMetaSchema.safeParse(metaInput);
  if (!metaResult.success) {
    return NextResponse.json({ error: metaResult.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
  }
  const meta = metaResult.data;

  const wantsFile = headers.get('x-has-file') === '1';

  let filePath = poster.filePath;
  let fileMime = poster.fileMime;
  let fileSize = poster.fileSize;
  let fileName = poster.fileName;

  const oldFilePath = poster.filePath;
  let savedFile: SavedPosterFile | null = null;
  if (wantsFile) {
    const mime = headers.get('content-type') || 'application/octet-stream';
    if (!ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
      return NextResponse.json({ error: 'Type non supporté' }, { status: 415 });
    }

    const rawName = headers.get('x-file-name') || encodeURIComponent(poster.fileName);
    let originalName: string;
    try {
      originalName = decodeURIComponent(rawName);
    } catch {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    if (!req.body) return NextResponse.json({ error: 'Corps manquant' }, { status: 400 });
    const webStream = req.body as unknown as NodeReadableStream<Uint8Array>;

    try {
      savedFile = await savePosterFile(webStream, mime, originalName, MAX_UPLOAD_BYTES);
    } catch (error) {
      const isTooLarge = error instanceof PosterFileTooLargeError;
      const message = isTooLarge ? error.message : 'Échec du téléversement';
      const status = isTooLarge ? 413 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    filePath = savedFile.key;
    fileMime = savedFile.mime;
    fileSize = savedFile.size;
    fileName = savedFile.name;
  }

  let nextStatus = poster.status;
  if (meta.saveAsDraft) {
    nextStatus = PosterStatus.DRAFT;
  } else if (poster.status === PosterStatus.DRAFT) {
    nextStatus = PosterStatus.READY;
  }

  let updated;
  try {
    updated = await prisma.poster.update({
      where: { id },
      data: {
        title: meta.title,
        description: meta.description ?? null,
        displayDuration: meta.displayDuration,
        scheduledAt: meta.scheduledAt ?? null,
        deleteAt: meta.deleteAt ?? null,
        status: nextStatus,
        filePath,
        fileMime,
        fileSize,
        fileName,
      },
    });
  } catch {
    if (savedFile) {
      await deletePosterFile(savedFile.key);
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  if (savedFile && oldFilePath && oldFilePath !== savedFile.key) {
    await deletePosterFile(oldFilePath);
  }

  return NextResponse.json({ id: updated.id }, { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: PosterRouteParams }) {
  const idResult = await parsePosterId(params);
  if (idResult instanceof NextResponse) return idResult;
  const id = idResult;

  const authContext = await requireAuthenticatedUser();
  if (authContext instanceof NextResponse) return authContext;
  const { userId, isAdmin } = authContext;

  const poster = await prisma.poster.findUnique({
    where: { id },
    select: { createdBy: true, filePath: true },
  });

  if (!poster) {
    return NextResponse.json({ error: 'Poster introuvable' }, { status: 404 });
  }

  if (!isAdmin && poster.createdBy !== userId) {
    return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
  }

  try {
    await prisma.poster.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }

  await deletePosterFile(poster.filePath);

  return NextResponse.json({ ok: true }, { status: 200 });
}
