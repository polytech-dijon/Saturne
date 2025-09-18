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
