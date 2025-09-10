import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import LoginPage from '@/app/login/page';

// Mock the LoginForm component
jest.mock('@/components/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form" />,
}));

describe('LoginPage', () => {
  it('renders the brand link with logo and text', () => {
    render(<LoginPage />);
    const link = screen.getByRole('link', { name: /Saturne/i });
    expect(link).toHaveAttribute('href', '/');
    const img = screen.getByAltText('Saturne logo');
    expect(img).toBeInTheDocument();
  });

  it('renders the LoginForm component', () => {
    render(<LoginPage />);
    expect(screen.getByTestId('login-form')).toBeInTheDocument();
  });
});
