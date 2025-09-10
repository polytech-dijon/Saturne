import { loginAction, ActionState } from '@/lib/login';

function createFormData(data: Record<string, string>): FormData {
  return {
    get: (key: string) =>
      Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null,
  } as unknown as FormData;
}

describe('loginAction', () => {
  const prevState: ActionState = { fieldErrors: {} };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return field errors when both username and password are empty', async () => {
    const formData = createFormData({});
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({
      fieldErrors: {
        username: 'Identifiant requis',
        password: 'Mot de passe requis',
      },
      serverError: null,
    });
  });

  it('should return error when only username is empty', async () => {
    const formData = createFormData({ password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({
      fieldErrors: { username: 'Identifiant requis' },
      serverError: null,
    });
  });

  it('should return error when only password is empty', async () => {
    const formData = createFormData({ username: 'user' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({
      fieldErrors: { password: 'Mot de passe requis' },
      serverError: null,
    });
  });

  it('should succeed when username and password are provided', async () => {
    const formData = createFormData({ username: 'user', password: 'pass' });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const result = await loginAction(prevState, formData);
    expect(logSpy).toHaveBeenCalledWith('Login data:', { username: 'user', password: 'pass' });
    expect(result).toEqual({ fieldErrors: {}, serverError: null });
  });

  it('should return serverError when console.log throws an Error', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => { throw new Error('fail'); });
    const formData = createFormData({ username: 'user', password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({ fieldErrors: {}, serverError: 'fail' });
  });

  it('should return default serverError when non-Error is thrown', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => { throw 'some error'; });
    const formData = createFormData({ username: 'user', password: 'pass' });
    const result = await loginAction(prevState, formData);
    expect(result).toEqual({ fieldErrors: {}, serverError: 'Erreur lors de la connexion' });
  });
});
