import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { posterMetaSchema, ALLOWED_MIME_PREFIXES, MAX_UPLOAD_BYTES } from '@/lib/zod';
import { PosterStatus } from '@prisma/client';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';
import { PosterFileTooLargeError, savePosterFile } from '@/lib/storage';
import { requireAuthenticatedUser } from '@/app/api/posters/_shared';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const authContext = await requireAuthenticatedUser();
  if (authContext instanceof NextResponse) return authContext;
  const { userId } = authContext;

  const headers = req.headers;
  const metaInput = {
    title: headers.get('x-title') || '',
    description: headers.get('x-description') || undefined,
    displayDuration: headers.get('x-display-duration') || '10',
    scheduledAt: headers.get('x-scheduled-at') || undefined,
    deleteAt: headers.get('x-delete-at') || undefined,
    saveAsDraft: headers.get('x-save-as-draft') || '0',
  };

  const parsed = posterMetaSchema.safeParse(metaInput);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation failed' }, { status: 400 });
  }
  const meta = parsed.data;

  const mime = req.headers.get('content-type') || 'application/octet-stream';
  if (!ALLOWED_MIME_PREFIXES.some((p) => mime.startsWith(p))) {
    return NextResponse.json({ error: 'Type non supporté' }, { status: 415 });
  }
  const rawName = req.headers.get('x-file-name') || 'upload.bin';
  let originalName: string;
  try {
    originalName = decodeURIComponent(rawName);
  } catch {
    return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
  }

  if (!req.body) return NextResponse.json({ error: 'Corps manquant' }, { status: 400 });
  const webStream = req.body as unknown as NodeReadableStream<Uint8Array>;

  let saved;
  try {
    saved = await savePosterFile(webStream, mime, originalName, MAX_UPLOAD_BYTES);
  } catch (error) {
    const isTooLarge = error instanceof PosterFileTooLargeError;
    const message = isTooLarge ? error.message : 'Échec du téléversement';
    const status = isTooLarge ? 413 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const poster = await prisma.poster.create({
    data: {
      title: meta.title,
      description: meta.description,
      displayDuration: meta.displayDuration,
      status: meta.saveAsDraft ? PosterStatus.DRAFT : PosterStatus.READY,
      createdBy: userId,

      filePath: saved.key,
      fileMime: saved.mime,
      fileSize: saved.size,
      fileName: saved.name,

      scheduledAt: meta.scheduledAt ?? null,
      deleteAt: meta.deleteAt ?? null,
    },
  });

  return NextResponse.json({ id: poster.id }, { status: 201 });
}
