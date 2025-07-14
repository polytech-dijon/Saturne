import { LoginForm } from '@/components/LoginForm';
import Link from 'next/link';
import Saturne from '@/../public/saturne.png';
import Image from 'next/image';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect('/dashboard');
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium text-xl">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
            <Image src={Saturne} className="size-8" alt="Saturne logo"/>
          </div>
          Saturne
        </Link>
        <LoginForm/>
      </div>
    </div>
  );
}
