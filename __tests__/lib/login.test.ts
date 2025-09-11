import { loginAction, ActionState } from '@/lib/login';
import { signIn } from '@/auth';
import { UsernameError, PasswordError } from '@/lib/errors';
import { CredentialsSignin } from 'next-auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

jest.mock('next/dist/client/components/redirect-error', () => ({
  isRedirectError: jest.fn(),
}));

jest.mock('@/auth', () => ({
  signIn: jest.fn(),
}));

function createFormData(data: Record<string, string>): FormData {
  return {
    get: (key: string) =>
      Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
  } as FormData;
}

describe('loginAction', () => {
  const prevState: ActionState = { fieldErrors: {} };

  beforeEach(() => {
    (signIn as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return username error when both username and password are empty', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce(new UsernameError('Identifiant requis'));
    const formData = createFormData({});
    const result = await loginAction(prevState, formData);
    expect(result.fieldErrors.username).toBe('Identifiant requis');
    expect(result.fieldErrors.password).toBeUndefined();
    expect(result.serverError).toBeNull();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should return error when only username is empty', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce(new UsernameError('Identifiant requis'));
    const formData = createFormData({ password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result.fieldErrors.username).toBe('Identifiant requis');
    expect(result.fieldErrors.password).toBeUndefined();
    expect(result.serverError).toBeNull();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should return error when only password is empty', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce(new PasswordError('Mot de passe requis'));
    const formData = createFormData({ username: 'user' });
    const result = await loginAction(prevState, formData);
    expect(result.fieldErrors.password).toBe('Mot de passe requis');
    expect(result.fieldErrors.username).toBeUndefined();
    expect(result.serverError).toBeNull();
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should succeed when username and password are provided', async () => {
    (signIn as jest.Mock).mockResolvedValueOnce(undefined);
    const formData = createFormData({ username: 'user', password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({ fieldErrors: {}, serverError: null });
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should return serverError when signIn throws an Error', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const formData = createFormData({ username: 'user', password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({ fieldErrors: {}, serverError: 'Erreur lors de la connexion' });
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should return default serverError when signIn throws a non-Error', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce('some error');
    const formData = createFormData({ username: 'user', password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({ fieldErrors: {}, serverError: 'Erreur lors de la connexion' });
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should return specific serverError when signIn throws CredentialsSignin', async () => {
    (signIn as jest.Mock).mockRejectedValueOnce(new CredentialsSignin());
    const formData = createFormData({ username: 'user', password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({ fieldErrors: {}, serverError: 'Mauvais identifiant ou mot de passe' });
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it('should rethrow when isRedirectError(error) returns true', async () => {
    const fakeRedirectError = { foo: 'bar' };
    (signIn as jest.Mock).mockRejectedValueOnce(fakeRedirectError);
    (isRedirectError as unknown as jest.Mock).mockReturnValueOnce(true);

    const formData = createFormData({ username: 'user', password: 'pass' });

    await expect(loginAction({ fieldErrors: {} }, formData)).rejects.toBe(fakeRedirectError);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(isRedirectError).toHaveBeenCalledWith(fakeRedirectError);
  });
});
