'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { clientPosterMetaSchema, MAX_UPLOAD_MB } from '@/lib/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { uploadPosterViaApi } from '@/lib/posters';
import { DateTimePicker } from '@/components/DateTimePicker';
import { XIcon } from 'lucide-react';
import Image from 'next/image';

type PosterFormValues = z.input<typeof clientPosterMetaSchema>;
type PosterFormResult = z.output<typeof clientPosterMetaSchema>;

const defaultValues: PosterFormValues = {
  title: '',
  description: '',
  displayDuration: 10,
  scheduledAt: undefined,
  deleteAt: undefined,
  saveAsDraft: false,
  file: null,
};

export type NewPosterFormProps = {
  redirectTo?: string;
};

export function NewPosterForm({ redirectTo }: NewPosterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<PosterFormValues, undefined, PosterFormResult>({
    resolver: zodResolver(clientPosterMetaSchema),
    defaultValues,
  });
  const disabled = useMemo(() => isPending || form.formState.isSubmitting, [isPending, form.formState.isSubmitting]);

  const watchedTitle = form.watch('title');
  const watchedFile = form.watch('file');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (watchedFile instanceof File) {
      const url = URL.createObjectURL(watchedFile);
      setPreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setPreviewUrl(null);
    return undefined;
  }, [watchedFile]);

  const missingRequirements: string[] = [];
  if (!watchedTitle?.trim()) missingRequirements.push('Ajoutez un titre');
  if (!(watchedFile instanceof File)) missingRequirements.push('Téléversez un média');

  const submitDisabled = disabled || missingRequirements.length > 0;

  const handleSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await uploadPosterViaApi(values.file!, {
        title: values.title,
        description: values.description || undefined,
        displayDuration: values.displayDuration,
        scheduledAt: values.scheduledAt,
        deleteAt: values.deleteAt,
        saveAsDraft: values.saveAsDraft,
      });
      if (result.ok) {
        toast.success('Poster créé avec succès.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.push(redirectTo ?? '/dashboard/posters');
        router.refresh();
      } else {
        const message = result.serverError || 'Erreur lors de la création du poster';
        toast.error(message);
      }
    });
  });

  return (
    <Card className="border-none shadow-muted">
      <CardHeader>
        <CardTitle className="text-lg">Informations du poster</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="after:ml-0.5 after:text-destructive after:content-['*']">Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre du poster" autoFocus disabled={disabled} required
                           aria-required="true" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Description facultative"
                      className="min-h-[120px]"
                      disabled={disabled}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="displayDuration"
              render={({ field }) => {
                const value = field.value as number | undefined;
                return (
                  <FormItem>
                    <FormLabel>Durée d’affichage (secondes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={120}
                        step={1}
                        inputMode="numeric"
                        disabled={disabled}
                        value={value ?? ''}
                        onChange={(event) =>
                          field.onChange(event.target.value === '' ? undefined : Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduledAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Début de diffusion (optionnel)</FormLabel>
                    <DateTimePicker field={field} placeholder="Sélectionner une date" disabled={disabled} />
                    <FormDescription>Laisser vide pour publier immédiatement.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deleteAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fin de diffusion (optionnel)</FormLabel>
                    <DateTimePicker field={field} placeholder="Sélectionner une date" disabled={disabled} />
                    <FormDescription>Laisser vide pour garder le poster actif indéfiniment.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="file"
              render={({ field }) => {
                const file = field.value as File | null;
                const handleClearFile = () => {
                  field.onChange(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                };
                return (
                  <FormItem>
                    <FormLabel className="after:ml-0.5 after:text-destructive after:content-['*']">Média</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        name={field.name}
                        disabled={disabled}
                        required
                        aria-required="true"
                        accept="image/*,video/*"
                        onBlur={field.onBlur}
                        ref={(element) => {
                          field.ref(element);
                          fileInputRef.current = element;
                        }}
                        onChange={(event) => {
                          const nextFile = event.target.files?.[0] ?? null;
                          field.onChange(nextFile);
                        }}
                      />
                    </FormControl>
                    {file ? (
                      <p className="text-xs text-muted-foreground">
                        {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Formats acceptés: image, vidéo. Taille max {MAX_UPLOAD_MB} MB.
                      </p>
                    )}
                    {previewUrl ? (
                      <div
                        className="mt-3 rounded-xl border border-border/60 bg-muted/50 p-1 shadow-inner hover:shadow-md transition-shadow">
                        <div className="relative aspect-video overflow-hidden rounded-lg bg-background">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClearFile}
                            disabled={disabled}
                            aria-label="Retirer le média sélectionné"
                            className="absolute right-3 top-3 z-20 rounded-full bg-card/70 text-foreground shadow-md backdrop-blur"
                          >
                            <XIcon className="h-4 w-4" />
                          </Button>
                          {file && file.type.startsWith('image/') ? (
                            <Image
                              src={previewUrl}
                              alt="Prévisualisation du média"
                              className="h-full w-full object-cover"
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          ) : file ? (
                            <video
                              src={previewUrl}
                              controls
                              className="h-full w-full object-contain"
                            />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="saveAsDraft"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className="hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-primary has-[[aria-checked=true]]:bg-accent/20">
                    <FormControl>
                      <Checkbox
                        className="data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-card-foreground"
                        checked={!!field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                        disabled={disabled}
                      />
                    </FormControl>
                    <div className="grid gap-1.5 font-normal">
                      <p className="text-sm leading-none font-medium">
                        Enregistrer comme brouillon
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Si activé, le poster restera en brouillon et ne sera pas diffusé tant qu’il n’est pas publié
                        manuellement.
                      </p>
                    </div>
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                asChild
              >
                <Link href={redirectTo ?? '/dashboard/posters'}>Annuler</Link>
              </Button>
              <Button type="submit" disabled={submitDisabled}>
                {disabled ? 'Enregistrement…' : 'Créer le poster'}
              </Button>
            </div>
            {!disabled && missingRequirements.length > 0 ? (
              <p className="text-xs text-muted-foreground text-right">
                {missingRequirements.join(' · ')}
              </p>
            ) : null}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
