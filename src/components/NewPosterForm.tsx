'use client';

import { PosterForm, type PosterFormValues } from '@/components/PosterForm';
import { uploadPosterViaApi } from '@/lib/posters';
import { clientPosterCreateSchema } from '@/lib/zod';

export type NewPosterFormProps = {
  redirectTo?: string;
};

const defaultValues: PosterFormValues = {
  title: '',
  description: '',
  displayDuration: 10,
  scheduledAt: undefined,
  deleteAt: undefined,
  saveAsDraft: false,
  file: null,
};

export function NewPosterForm({ redirectTo }: NewPosterFormProps) {
  return (
    <PosterForm
      title="Créer un nouveau poster"
      subtitle="Téléchargez un média et planifiez sa diffusion."
      schema={clientPosterCreateSchema}
      defaultValues={defaultValues}
      mode="create"
      redirectTo={redirectTo}
      successMessage="Poster créé avec succès."
      onSubmitAction={async (values) => {
        const { file, ...meta } = values;
        if (!(file instanceof File)) {
          return { ok: false as const, error: 'Fichier invalide' };
        }
        const result = await uploadPosterViaApi(file, meta);
        if (result.ok) return { ok: true as const, id: result.id };
        return { ok: false as const, error: result.serverError };
      }}
    />
  );
}
