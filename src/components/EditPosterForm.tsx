'use client';

import { PosterForm, type PosterFormExistingAsset, type PosterFormValues } from '@/components/PosterForm';
import { updatePosterViaApi } from '@/lib/posters';
import { clientPosterUpdateSchema } from '@/lib/zod';

export type EditPosterFormProps = {
  posterId: number;
  initialValues: PosterFormValues;
  redirectTo?: string;
  existingAsset: PosterFormExistingAsset;
};

export function EditPosterForm({ posterId, initialValues, redirectTo, existingAsset }: EditPosterFormProps) {
  return (
    <PosterForm
      title="Modifier le poster"
      subtitle="Mettez à jour les informations ou remplacez le média."
      schema={clientPosterUpdateSchema}
      defaultValues={initialValues}
      mode="edit"
      redirectTo={redirectTo}
      existingAsset={existingAsset}
      requireFile={!existingAsset}
      successMessage="Poster mis à jour avec succès."
      submitLabel="Enregistrer les modifications"
      onSubmitAction={async (values) => {
        const { file, ...meta } = values;
        const result = await updatePosterViaApi(posterId, meta, file instanceof File ? file : undefined);
        if (result.ok) return { ok: true as const, id: result.id };
        return { ok: false as const, error: result.serverError };
      }}
    />
  );
}
