import { Poster, PosterStatus } from '@prisma/client';

export type PosterState = 'SCHEDULED' | 'PUBLISHED' | 'EXPIRED' | 'DISABLED' | 'DRAFT';

export function computePosterState(input: {
  status: PosterStatus;
  scheduledAt: Date | null;
  deleteAt: Date | null;
  now?: Date;
}): PosterState {
  const now = input.now ?? new Date();

  if (input.status === PosterStatus.DISABLED) return 'DISABLED';
  if (input.status === PosterStatus.DRAFT) return 'DRAFT';

  const start = input.scheduledAt ?? new Date(0);        // -∞ if null
  const end = input.deleteAt ?? new Date('9999-12-31');  // +∞ if null

  if (now < start) return 'SCHEDULED';
  if (now >= start && now < end) return 'PUBLISHED';
  return 'EXPIRED';
}

export type PosterPossiblyWithCreator = Poster & { creator?: { username: string; id: number } };


export async function uploadPosterViaApi(file: File, meta: {
  title: string;
  description?: string;
  displayDuration: number;
  scheduledAt?: Date;
  deleteAt?: Date;
  saveAsDraft: boolean;
}) {
  const headers: Record<string, string> = {
    'content-type': file.type || 'application/octet-stream',
    'x-file-name': encodeURIComponent(file.name),
    'x-title': meta.title,
    'x-display-duration': String(meta.displayDuration),
    'x-save-as-draft': meta.saveAsDraft ? '1' : '0',
  };
  if (meta.description) headers['x-description'] = meta.description;
  if (meta.scheduledAt) headers['x-scheduled-at'] = meta.scheduledAt.toISOString();
  if (meta.deleteAt) headers['x-delete-at'] = meta.deleteAt.toISOString();

  const res = await fetch('/api/posters', {
    method: 'POST',
    headers,
    body: file,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
  }
  if (!res.ok) {
    const serverError = payload?.error || payload?.serverError || 'Erreur serveur';
    return { ok: false as const, serverError };
  }
  return { ok: true as const, id: payload?.id };
}
