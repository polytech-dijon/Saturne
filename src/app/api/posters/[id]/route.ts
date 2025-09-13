import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import { createReadStream, statSync } from 'fs';
import path from 'path';
import { PosterStatus, Role } from '@prisma/client';
import { Readable } from 'node:stream';

export const runtime = 'nodejs';
if (!process.env.UPLOAD_ROOT) throw new Error('UPLOAD_ROOT env var is not set');
const ROOT = process.env.UPLOAD_ROOT;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

  const poster = await prisma.poster.findUnique({
    where: { id },
    select: { filePath: true, fileMime: true, createdBy: true, status: true },
  });
  if (!poster) return NextResponse.json({ error: 'Not found' }, { status: 404 });

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
  if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
