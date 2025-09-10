import { LoginForm } from "@/components/LoginForm"
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium text-xl">
          <div className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
            <img src="/saturne.png" className="size-8" alt="Saturne logo"/>
          </div>
          Saturne
        </Link>
        <LoginForm />
      </div>
    </div>
  )
}
