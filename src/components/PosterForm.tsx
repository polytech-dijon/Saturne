'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Link from 'next/link';
import Image from 'next/image';
import { XIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DateTimePicker } from '@/components/DateTimePicker';
import { MAX_UPLOAD_MB, clientPosterUpdateSchema } from '@/lib/zod';

const DEFAULT_REDIRECT = '/dashboard/posters';

export type PosterFormValues = z.input<typeof clientPosterUpdateSchema>;
export type PosterFormResult = z.output<typeof clientPosterUpdateSchema>;

export type PosterFormSubmissionResult = { ok: true; id?: number } | { ok: false; error?: string };

export type PosterFormExistingAsset = {
  url: string;
  type: 'image' | 'video' | 'other';
  name: string;
  size: number;
};

export type PosterFormSchema = z.ZodType<PosterFormResult, PosterFormValues>;

export type PosterFormProps = {
  title: string;
  subtitle: string;
  schema: PosterFormSchema;
  defaultValues: PosterFormValues;
  mode: 'create' | 'edit';
  onSubmitAction: (values: PosterFormResult) => Promise<PosterFormSubmissionResult>;
  redirectTo?: string;
  existingAsset?: PosterFormExistingAsset | null;
  requireFile?: boolean;
  successMessage: string;
  submitLabel?: string;
  processingLabel?: string;
  cancelLabel?: string;
  cancelHref?: string;
};

function formatMegabytes(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function inferAssetType(mime: string | undefined): PosterFormExistingAsset['type'] {
  if (!mime) return 'other';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  return 'other';
}

export function PosterForm({
                             title,
                             subtitle,
                             schema,
                             defaultValues,
                             mode,
                             onSubmitAction,
                             redirectTo,
                             existingAsset = null,
                             requireFile: requireFileProp,
                             successMessage,
                             submitLabel,
                             processingLabel,
                             cancelLabel = 'Annuler',
                             cancelHref,
                           }: PosterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<PosterFormValues, undefined, PosterFormResult>({
    resolver: zodResolver<PosterFormValues, undefined, PosterFormResult>(schema),
    defaultValues,
  });

  const disabled = useMemo(
    () => isPending || form.formState.isSubmitting,
    [isPending, form.formState.isSubmitting],
  );

  const watchedTitle = form.watch('title') as string | undefined;
  const watchedFile = form.watch('file') as File | null | undefined;

  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (watchedFile instanceof File) {
      const url = URL.createObjectURL(watchedFile);
      setFilePreviewUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setFilePreviewUrl(null);
    return undefined;
  }, [watchedFile]);

  const hasExistingAsset = !!existingAsset;
  const requireFile = requireFileProp ?? (mode === 'create' && !hasExistingAsset);
  const previewUrl = filePreviewUrl ?? existingAsset?.url ?? null;
  const previewType = watchedFile instanceof File
    ? inferAssetType(watchedFile.type)
    : existingAsset?.type ?? 'other';

  const missingRequirements: string[] = [];
  if (!watchedTitle?.trim()) missingRequirements.push('Ajoutez un titre');
  if (requireFile && !(watchedFile instanceof File)) missingRequirements.push('Téléversez un média');

  const submitDisabled = disabled || missingRequirements.length > 0;

  const effectiveSubmitLabel = submitLabel ?? (mode === 'create' ? 'Créer le poster' : 'Enregistrer');
  const effectiveProcessingLabel = processingLabel ?? 'Enregistrement…';
  const effectiveRedirect = redirectTo ?? DEFAULT_REDIRECT;
  const effectiveCancelHref = cancelHref ?? effectiveRedirect;

  const handleSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await onSubmitAction(values);
      if (result.ok) {
        toast.success(successMessage);
        if (fileInputRef.current) fileInputRef.current.value = '';
        router.push(effectiveRedirect);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Erreur lors de la sauvegarde du poster');
      }
    });
  });

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mb-2">
          {subtitle}
        </p>
      </div>
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
                      <Input
                        placeholder="Titre du poster"
                        autoFocus
                        disabled={disabled}
                        required
                        aria-required="true"
                        {...field}
                      />
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
                            field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                          }
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
                  const file = field.value as File | null | undefined;
                  const hasNewFile = file instanceof File;
                  const displayedName = hasNewFile
                    ? file.name
                    : existingAsset?.name;
                  const displayedSize = hasNewFile
                    ? formatMegabytes(file.size)
                    : existingAsset ? formatMegabytes(existingAsset.size) : null;

                  const handleClearFile = () => {
                    field.onChange(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  };

                  return (
                    <FormItem>
                      <FormLabel className="after:ml-0.5 after:text-destructive after:content-['*']">
                        Média{requireFile ? '' : ' (optionnel)'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          name={field.name}
                          disabled={disabled}
                          required={requireFile}
                          aria-required={requireFile ? 'true' : 'false'}
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
                      {displayedName ? (
                        <p className="text-xs text-muted-foreground">
                          {displayedName}{displayedSize ? ` — ${displayedSize} MB` : ''}{hasNewFile ? '' : ' (actuel)'}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Formats acceptés: image, vidéo. Taille max {MAX_UPLOAD_MB} MB.
                        </p>
                      )}
                      {previewUrl && previewType !== 'other' ? (
                        <div
                          className="mt-3 rounded-xl border border-border/60 bg-muted/50 p-1 shadow-inner transition-shadow hover:shadow-md">
                          <div className="relative aspect-video overflow-hidden rounded-lg bg-background">
                            {hasNewFile ? (
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
                            ) : null}
                            {previewType === 'image' ? (
                              <Image
                                src={previewUrl}
                                alt="Prévisualisation du média"
                                className="h-full w-full object-cover"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                unoptimized
                              />
                            ) : (
                              <video
                                src={previewUrl}
                                controls
                                className="h-full w-full object-contain"
                              />
                            )}
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
                <Button type="button" variant="outline" disabled={disabled} asChild>
                  <Link href={effectiveCancelHref}>{cancelLabel}</Link>
                </Button>
                <Button type="submit" disabled={submitDisabled}>
                  {disabled ? effectiveProcessingLabel : effectiveSubmitLabel}
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
    </div>
  );
}
