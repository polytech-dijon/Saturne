import { IconAlertOctagon } from '@tabler/icons-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) return redirect(`/login?callbackUrl=${encodeURIComponent('/dashboard/users')}`);
  if (session.user.role !== 'ADMIN') redirect('/dashboard');
  
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <IconAlertOctagon className="text-red-500 mb-4" size={64} />
      <h1 className="text-2xl font-bold">Page under construction</h1>
      <p className="text-gray-400 mt-2">We are working on it, please check back later.</p>
    </div>
  );
}
