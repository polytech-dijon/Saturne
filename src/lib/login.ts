'use server';

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

  const fieldErrors: ActionState['fieldErrors'] = {};
  if (!username.trim()) fieldErrors.username = 'Identifiant requis';
  if (!password.trim()) fieldErrors.password = 'Mot de passe requis';

  if (Object.keys(fieldErrors).length) {
    return { fieldErrors, serverError: null };
  }

  try {
    // TODO: remplacer par appel API réel de connexion
    console.log('Login data:', { username, password });
    return { fieldErrors: {}, serverError: null };
  } catch (error: unknown) {
    return {
      fieldErrors: {},
      serverError: error instanceof Error ? error.message : 'Erreur lors de la connexion',
    };
  }
}
