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

/** Small helper: accepts a <input type="datetime-local"> (string) or empty */
const zDatetimeLocalOptional = zfd
  .text(z.string().trim().max(30).optional())
  .transform((v) => (v ? new Date(v) : undefined))
  .refine((d) => d === undefined || !Number.isNaN(d.getTime()), {
    message: 'Date invalide',
  });

export const createPosterFormSchema = zfd.formData({
  title: zfd.text(
    z.string().trim().min(1, 'Titre requis').max(200, 'Titre trop long'),
  ),
  description: zfd.text(z.string().trim().max(2000)).optional(),

  displayDuration: zfd
    .numeric(
      z
        .number()
        .int('Durée invalide')
        .min(1, '≥ 1 seconde')
        .max(120, '≤ 2 minutes'),
    )
    .default(10),

  scheduledAt: zDatetimeLocalOptional,
  deleteAt: zDatetimeLocalOptional,

  saveAsDraft: zfd.checkbox().default(false),
  
  file: zfd
    .file()
    .refine((f) => !!f, 'Fichier requis')
    .refine((f) => (f?.size ?? 0) > 0, 'Fichier vide')
    .refine(
      (f) => (f?.size ?? 0) <= MAX_UPLOAD_BYTES,
      `Fichier trop volumineux (max ${MAX_UPLOAD_MB} MB)`,
    )
    .refine(
      (f) => ALLOWED_MIME_PREFIXES.some((p) => (f?.type || '').startsWith(p)),
      'Type de fichier non supporté (image/* ou video/*)',
    ),
})
  .superRefine((data, ctx) => {
    // Cross-field rule: deleteAt >= scheduledAt if both are provided
    if (data.scheduledAt && data.deleteAt && data.deleteAt < data.scheduledAt) {
      ctx.addIssue({
        code: 'custom',
        message: 'La date de suppression doit être postérieure au début de diffusion',
        path: ['deleteAt'],
      });
    }
  });
