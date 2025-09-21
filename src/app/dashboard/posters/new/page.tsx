import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { NewPosterForm } from '@/components/NewPosterForm';

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'Nouveau poster',
};

export default async function NewPosterPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) {
    return redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/posters/new')}`);
  }

  const sp = (await searchParams) ?? {};
  const rawRedirect = typeof sp.redirect === 'string' ? sp.redirect : undefined;
  const redirectTo = rawRedirect && rawRedirect.startsWith('/dashboard') ? rawRedirect : undefined;

  return (
    <div className="flex flex-col gap-5 p-4 md:gap-6 md:p-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Créer un nouveau poster</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Téléchargez un média et planifiez sa diffusion.
        </p>
      </div>
      <NewPosterForm redirectTo={redirectTo} />
    </div>
  );
}
