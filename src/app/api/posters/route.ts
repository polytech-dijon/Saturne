import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { posterMetaSchema, ALLOWED_MIME_PREFIXES, MAX_UPLOAD_BYTES } from '@/lib/zod';
import { PosterStatus } from '@prisma/client';
import { mkdir, unlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { join, extname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import crypto from 'node:crypto';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

if (!process.env.UPLOAD_ROOT) throw new Error('UPLOAD_ROOT env var is not set');
const ROOT = process.env.UPLOAD_ROOT;
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const userId = session.user.id ?? session.user?.id;
  if (!userId) return NextResponse.json({ error: 'Utilisateur invalide' }, { status: 401 });

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
  const originalName = decodeURIComponent(rawName);

  if (!req.body) return NextResponse.json({ error: 'Corps manquant' }, { status: 400 });
  await mkdir(ROOT, { recursive: true });

  const ext = extname(originalName) || '';
  const key = crypto.randomUUID() + ext;
  const abs = join(ROOT, key);

  const webStream = req.body as unknown as NodeReadableStream<Uint8Array>;
  const nodeStream = Readable.fromWeb(webStream);
  const ws = createWriteStream(abs, { flags: 'wx' });
  let size = 0;

  nodeStream.on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size > MAX_UPLOAD_BYTES) {
      ws.destroy(new Error('Fichier trop volumineux'));
      nodeStream.destroy(new Error('Fichier trop volumineux'));
    }
  });

  try {
    await pipeline(nodeStream, ws);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Échec du téléversement';
    try {
      await unlink(abs);
    } catch {
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const poster = await prisma.poster.create({
    data: {
      title: meta.title,
      description: meta.description,
      displayDuration: meta.displayDuration,
      status: meta.saveAsDraft ? PosterStatus.DRAFT : PosterStatus.READY,
      createdBy: userId,

      filePath: key,
      fileMime: mime,
      fileSize: size,
      fileName: originalName,

      scheduledAt: meta.scheduledAt ?? null,
      deleteAt: meta.deleteAt ?? null,
    },
  });

  return NextResponse.json({ id: poster.id }, { status: 201 });
}
