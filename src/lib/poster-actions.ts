'use server';

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createPosterFormSchema } from '@/lib/zod';
import { z } from 'zod';
import { PosterStatus } from '@prisma/client';

if (!process.env.UPLOAD_ROOT) throw new Error('UPLOAD_ROOT env var is not set');
const ROOT = process.env.UPLOAD_ROOT;

export async function createPosterAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Non authentifié');
  const userId = session.user.id ?? session.user?.id;
  if (!userId) throw new Error('Utilisateur invalide');

  try {
    const { title, description, displayDuration, scheduledAt, deleteAt, saveAsDraft, file } =
      createPosterFormSchema.parse(formData);

    const buf = Buffer.from(await file.arrayBuffer());
    const mime = file.type || 'application/octet-stream';

    await mkdir(ROOT, { recursive: true });
    const ext = path.extname(file.name) || '';
    const key = `${randomUUID()}${ext}`;
    const abs = path.join(ROOT, key);
    await writeFile(abs, buf, { flag: 'wx' });

    await prisma.poster.create({
      data: {
        title,
        description,
        displayDuration,
        status: saveAsDraft ? PosterStatus.DRAFT : PosterStatus.READY,
        createdBy: userId,

        filePath: path.relative(ROOT, abs),
        fileMime: mime,
        fileSize: buf.length,
        fileName: file.name,

        scheduledAt: scheduledAt ?? null,
        deleteAt: deleteAt ?? null,
      },
    });

    return { ok: true, fieldErrors: {}, serverError: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      type CreateFormKeys = keyof z.infer<typeof createPosterFormSchema>;
      const flat = z.flattenError(err) as {
        fieldErrors: Partial<Record<CreateFormKeys, string[]>>;
        formErrors: string[];
      };
      return {
        ok: false,
        fieldErrors: {
          title: flat.fieldErrors.title?.[0],
          description: flat.fieldErrors.description?.[0],
          displayDuration: flat.fieldErrors.displayDuration?.[0],
          scheduledAt: flat.fieldErrors.scheduledAt?.[0],
          deleteAt: flat.fieldErrors.deleteAt?.[0],
          saveAsDraft: flat.fieldErrors.saveAsDraft?.[0],
          file: flat.fieldErrors.file?.[0],
        },
        serverError: flat.formErrors[0] ?? null,
      };
    }
    return { ok: false, fieldErrors: {}, serverError: 'Erreur serveur' };
  }
}
