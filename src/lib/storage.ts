import 'server-only';

import { mkdir, unlink } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { extname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

if (!process.env.UPLOAD_ROOT) {
  throw new Error('UPLOAD_ROOT env var is not set');
}
const UPLOAD_ROOT = process.env.UPLOAD_ROOT;

export type SavedPosterFile = {
  key: string;
  mime: string;
  size: number;
  name: string;
};

export class PosterFileTooLargeError extends Error {
  constructor() {
    super('Fichier trop volumineux');
  }
}

export async function savePosterFile(stream: NodeReadableStream<Uint8Array>, mime: string, originalName: string, maxBytes: number): Promise<SavedPosterFile> {
  await mkdir(UPLOAD_ROOT, { recursive: true });

  const ext = extname(originalName) || '';
  const key = `${randomUUID()}${ext}`;
  const abs = join(UPLOAD_ROOT, key);

  const nodeStream = Readable.fromWeb(stream);
  const writable = createWriteStream(abs, { flags: 'wx' });
  let size = 0;

  nodeStream.on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new PosterFileTooLargeError();
      writable.destroy(error);
      nodeStream.destroy(error);
    }
  });

  try {
    await pipeline(nodeStream, writable);
  } catch (error) {
    try {
      await unlink(abs);
    } catch {
    }
    if (error instanceof PosterFileTooLargeError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new Error(error.message || 'Échec du téléversement');
    }
    throw new Error('Échec du téléversement');
  }

  return { key, mime, size, name: originalName };
}

export async function deletePosterFile(key: string | null | undefined): Promise<void> {
  if (!key) return;
  const abs = join(UPLOAD_ROOT, key);
  try {
    await unlink(abs);
  } catch {
  }
}
