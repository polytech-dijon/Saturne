import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { NewPosterForm } from '@/components/NewPosterForm';
import { safeRedirectPosterPath } from '@/lib/posters';

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
  const redirectParam = Array.isArray(sp.redirect) ? sp.redirect[0] : sp.redirect;
  const redirectTo = safeRedirectPosterPath(typeof redirectParam === 'string' ? redirectParam : undefined);

  return <NewPosterForm redirectTo={redirectTo} />;
}
