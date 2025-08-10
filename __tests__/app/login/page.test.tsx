import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

jest.mock('@/auth');
jest.mock('next/navigation', () => ({ redirect: jest.fn() }));
jest.mock('@/components/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form"/>,
}));

describe('LoginPage', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /dashboard when a session exists', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { name: 'Test' } });

    await LoginPage();

    expect(redirect).toHaveBeenCalledWith('/dashboard');
  });

  it('renders the login form and link when no session', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const element = await LoginPage();
    render(element);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();

    const link = screen.getByRole('link', { name: /saturne/i });
    expect(link).toHaveAttribute('href', '/');

    expect(screen.getByAltText('Saturne logo')).toBeInTheDocument();
  });
});
