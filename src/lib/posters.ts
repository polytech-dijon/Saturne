import { Poster, PosterStatus } from '@prisma/client';

type JsonRecord = Record<string, unknown>;

function isJsonRecord(input: unknown): input is JsonRecord {
  return typeof input === 'object' && input !== null;
}

async function safeJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractServerError(payload: unknown, fallback: string) {
  if (!isJsonRecord(payload)) return fallback;
  const { error, serverError, message } = payload as {
    error?: unknown;
    serverError?: unknown;
    message?: unknown;
  };
  if (typeof error === 'string') return error;
  if (typeof serverError === 'string') return serverError;
  if (typeof message === 'string') return message;
  return fallback;
}

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

  const payload = await safeJson(res);
  if (!res.ok) {
    const serverError = extractServerError(payload, 'Erreur serveur');
    return { ok: false as const, serverError };
  }

  const id = isJsonRecord(payload) && typeof payload.id === 'number' ? payload.id : undefined;
  return { ok: true as const, id };
}

export async function updatePosterViaApi(
  id: number,
  meta: {
    title: string;
    description?: string;
    displayDuration: number;
    scheduledAt?: Date;
    deleteAt?: Date;
    saveAsDraft: boolean;
  },
  file?: File,
) {
  const headers: Record<string, string> = {
    'x-title': meta.title,
    'x-display-duration': String(meta.displayDuration),
    'x-save-as-draft': meta.saveAsDraft ? '1' : '0',
    'x-has-file': file ? '1' : '0',
  };

  if (meta.description) headers['x-description'] = meta.description;
  if (meta.scheduledAt) headers['x-scheduled-at'] = meta.scheduledAt.toISOString();
  if (meta.deleteAt) headers['x-delete-at'] = meta.deleteAt.toISOString();

  let body: BodyInit;
  if (file) {
    headers['content-type'] = file.type || 'application/octet-stream';
    headers['x-file-name'] = encodeURIComponent(file.name);
    body = file;
  } else {
    headers['content-type'] = 'application/json';
    body = '{}';
  }

  const res = await fetch(`/api/posters/${id}`, {
    method: 'PATCH',
    headers,
    body,
  });

  const payload = await safeJson(res);

  if (!res.ok) {
    const serverError = extractServerError(payload, 'Erreur serveur');
    return { ok: false as const, serverError };
  }

  const updatedId = isJsonRecord(payload) && typeof payload.id === 'number' ? payload.id : undefined;
  return { ok: true as const, id: updatedId };
}

export function safeRedirectPosterPath(input: string | undefined) {
  if (!input) return undefined;
  return input.startsWith('/dashboard') ? input : undefined;
}

export async function updatePosterStatusViaApi(id: number, status: PosterStatus) {
  const res = await fetch(`/api/posters/${id}/status`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  const payload = await safeJson(res);

  if (!res.ok) {
    const serverError = extractServerError(payload, 'Erreur serveur');
    return { ok: false as const, serverError };
  }

  const nextStatus = isJsonRecord(payload) && typeof payload.status === 'string'
    ? (payload.status as PosterStatus)
    : undefined;

  return { ok: true as const, status: nextStatus };
}

export async function deletePosterViaApi(id: number) {
  const res = await fetch(`/api/posters/${id}`, {
    method: 'DELETE',
  });

  const payload = await safeJson(res);

  if (!res.ok) {
    const serverError = extractServerError(payload, 'Erreur serveur');
    return { ok: false as const, serverError };
  }

  return { ok: true as const };
}
