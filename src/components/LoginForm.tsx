'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { ComponentProps, useActionState, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { loginAction } from '@/lib/login';

export function LoginForm({
                            className,
                            ...props
                          }: ComponentProps<'div'>) {
  const [state, action, pending] = useActionState(loginAction, { fieldErrors: {}, serverError: null });
  const [username, setUsername] = useState('');
  useEffect(() => {
    if (!pending && state.serverError) {
      toast.error(state.serverError);
      setUsername('');
    }
  }, [pending, state.serverError]);

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className="border-none shadow-muted">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bon retour</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} noValidate>
            <div className="grid gap-6">
              <div className="grid gap-3">
                <div className="grid gap-0">
                  <Label htmlFor="username">Identifiant</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Votre identifiant"
                    aria-invalid={!!state.fieldErrors.username}
                    className="mt-3"
                    required
                    tabIndex={1}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <p className={`text-xs text-red-600 mt-1 h-4 ${state.fieldErrors.username ? '' : 'invisible'}`}>
                    {state.fieldErrors.username}
                  </p>
                </div>
                <div className="grid gap-0">
                  <div className="flex items-center">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Dialog>
                      <DialogTrigger asChild>
                        <a href="#" className="ml-auto text-sm underline-offset-4 hover:underline" tabIndex={3}>
                          Mot de passe oublié ?
                        </a>
                      </DialogTrigger>
                      <DialogContent className="border-none shadow-background shadow-md">
                        <DialogHeader>
                          <DialogTitle>Mot de passe oublié</DialogTitle>
                          <DialogDescription>
                            Si vous avez oublié votre mot de passe, veuillez demander à un membre de l&apos;association
                            PolyBytes de réinitialiser votre mot de passe.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button>Fermer</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    aria-invalid={!!state.fieldErrors.password}
                    className="mt-3"
                    required
                    tabIndex={2}
                  />
                  <p className={`text-xs text-red-600 mt-1 h-4 ${state.fieldErrors.password ? '' : 'invisible'}`}>
                    {state.fieldErrors.password}
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Se connecter
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
