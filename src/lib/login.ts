'use server';

import { signIn } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { CredentialsSignin } from 'next-auth';
import { signInFormSchema } from '@/lib/zod';
import { z } from 'zod';

export type ActionState = {
  fieldErrors: {
    username?: string;
    password?: string;
  };
  serverError?: string | null;
};

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const { username, password } = signInFormSchema.parse(formData);
    await signIn('credentials', {
      username,
      password,
      redirectTo: '/dashboard/posters',
    });
    return { fieldErrors: {}, serverError: null };
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      type SignInKeys = keyof z.infer<typeof signInFormSchema>;
      const flat = z.flattenError(error) as {
        fieldErrors: Partial<Record<SignInKeys, string[]>>;
        formErrors: string[];
      };
      return {
        fieldErrors: {
          username: flat.fieldErrors.username?.[0],
          password: flat.fieldErrors.password?.[0],
        },
        serverError: flat.formErrors[0] ?? null,
      };
    }

    if (isRedirectError(error)) {
      throw error;
    }

    if (error instanceof CredentialsSignin) {
      return { fieldErrors: {}, serverError: 'Mauvais identifiant ou mot de passe' };
    }

    return { fieldErrors: {}, serverError: 'Erreur lors de la connexion' };
  }
}
