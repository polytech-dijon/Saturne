import { z } from 'zod';
import { zfd } from 'zod-form-data';

export const signInSchema = z.object({
  username: z.string().min(1, 'Le nom d’utilisateur est requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export const signInFormSchema = zfd.formData({
  username: zfd.text(z.string().min(1, 'Le nom d’utilisateur est requis')),
  password: zfd.text(z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')),
});

export const ALLOWED_MIME_PREFIXES = ['image/', 'video/'] as const;
export const MAX_UPLOAD_MB = 200;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const posterMetaSchema = z
  .object({
    title: z.string().trim().min(1, 'Titre requis').max(200, 'Titre trop long'),
    description: z
      .string()
      .trim()
      .max(2000, 'Description trop longue')
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
    displayDuration: z.coerce
      .number()
      .int('Durée invalide')
      .min(1, '≥ 1 seconde')
      .max(120, '≤ 2 minutes')
      .default(10),
    scheduledAt: z
      .preprocess(
        (v) => (typeof v === 'string' ? (v ? new Date(v) : undefined) : v),
        z.date().optional(),
      ),
    deleteAt: z
      .preprocess(
        (v) => (typeof v === 'string' ? (v ? new Date(v) : undefined) : v),
        z.date().optional(),
      ),
    saveAsDraft: z
      .preprocess(
        (v) =>
          typeof v === 'string'
            ? v === 'on' || v === 'true' || v === '1'
            : typeof v === 'boolean'
              ? v
              : false,
        z.boolean(),
      )
      .default(false),
  })
  .superRefine((data, ctx) => {
    if (data.scheduledAt && data.deleteAt && data.deleteAt < data.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'La date de suppression doit être postérieure au début de diffusion',
        path: ['deleteAt'],
      });
    }
  });

const posterFileSchema = z
  .instanceof(File, { message: 'Fichier requis' })
  .refine((f) => f.size > 0, { message: 'Fichier vide' })
  .refine(
    (f) => f.size <= MAX_UPLOAD_BYTES,
    { message: `Fichier trop volumineux (max ${MAX_UPLOAD_MB} MB)` },
  )
  .refine(
    (f) => ALLOWED_MIME_PREFIXES.some((p) => f.type.startsWith(p)),
    { message: 'Type non supporté (image/* ou video/*)' },
  )
  .nullable();

const clientPosterBaseSchema = posterMetaSchema.safeExtend({
  file: posterFileSchema,
});

export const clientPosterCreateSchema = clientPosterBaseSchema.superRefine((data, ctx) => {
  if (!(data.file instanceof File)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Fichier requis',
      path: ['file'],
    });
  }
});

export const clientPosterUpdateSchema = clientPosterBaseSchema;
