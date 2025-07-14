import { auth } from '@/auth';

export default async function Page() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <div>
      Bonjour, {session?.user?.name ?? 'invité'}
    </div>
  );
}
