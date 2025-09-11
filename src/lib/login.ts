'use server';

import { signIn } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { CredentialsSignin } from 'next-auth';
import { PasswordError, UsernameError } from '@/lib/errors';

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
    const username = formData.get('username')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    try {
        await signIn('credentials', {
            username,
            password,
            redirectTo: '/dashboard',
        });
        return { fieldErrors: {}, serverError: null };
    } catch (error: unknown) {
        if (isRedirectError(error)) {
            throw error;
        }

        if (error instanceof UsernameError) {
            return { fieldErrors: { username: error.message }, serverError: null };
        }

        if (error instanceof PasswordError) {
            return { fieldErrors: { password: error.message }, serverError: null };
        }

        if (error instanceof CredentialsSignin) {
            return { fieldErrors: {}, serverError: 'Mauvais identifiant ou mot de passe' };
        }

        return { fieldErrors: {}, serverError: 'Erreur lors de la connexion' };
    }
}
