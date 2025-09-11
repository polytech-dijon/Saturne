import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/LoginForm';
import { toast } from 'sonner';

// Mock useActionState from React
jest.mock('react', () => {
  const original = jest.requireActual('react');
  return {
    ...original,
    useActionState: jest.fn(),
  };
});

// Mock toast.error
jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}));

describe('LoginForm component', () => {
  const mockAction = jest.fn();
  let useActionStateMock: jest.Mock;

  beforeEach(() => {
    useActionStateMock = React.useActionState as jest.Mock;
    jest.clearAllMocks();
  });

  it('renders labels, inputs, button, and link with correct attributes', () => {
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: null }, mockAction, false]);
    render(<LoginForm/>);
    // Inputs
    const userInput = screen.getByLabelText('Identifiant');
    expect(userInput).toHaveAttribute('id', 'username');
    expect(userInput).toHaveAttribute('tabIndex', '1');
    const passInput = screen.getByLabelText('Mot de passe');
    expect(passInput).toHaveAttribute('id', 'password');
    expect(passInput).toHaveAttribute('tabIndex', '2');
    // Button
    const submit = screen.getByRole('button', { name: /se connecter/i });
    expect(submit).toBeEnabled();
    // Forgot password link
    const forgotLink = screen.getByRole('link', { name: /mot de passe oublié/i });
    expect(forgotLink).toHaveAttribute('tabIndex', '3');
  });

  it('shows error messages when fieldErrors are provided', () => {
    useActionStateMock.mockReturnValue([
      { fieldErrors: { username: 'Identifiant requis', password: 'Mot de passe requis' }, serverError: null },
      mockAction,
      false,
    ]);
    render(<LoginForm/>);
    expect(screen.getByText('Identifiant requis')).toBeVisible();
    expect(screen.getByText('Mot de passe requis')).toBeVisible();
  });

  it('hides error paragraphs when no fieldErrors', () => {
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: null }, mockAction, false]);
    const { container } = render(<LoginForm/>);
    // Both error <p> elements should have the 'invisible' class
    const invisibleParas = container.querySelectorAll('p.invisible');
    expect(invisibleParas).toHaveLength(2);
  });

  it('disables submit button when pending is true', () => {
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: null }, mockAction, true]);
    render(<LoginForm/>);
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeDisabled();
  });

  it('calls toast.error when serverError is present and pending is false', () => {
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: 'Erreur serveur' }, mockAction, false]);
    render(<LoginForm/>);
    expect(toast.error).toHaveBeenCalledWith('Erreur serveur');
  });

  it('does not call toast.error when pending is true', () => {
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: 'Erreur réseau' }, mockAction, true]);
    render(<LoginForm/>);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('updates the username on change and clears it when a serverError appears', () => {
    // Initial render: pending true, no error (so we can type)
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: null }, mockAction, true]);
    const { rerender } = render(<LoginForm/>);
    const userInput = screen.getByLabelText('Identifiant') as HTMLInputElement;

    // Simulate typing
    fireEvent.change(userInput, { target: { value: 'alice' } });
    expect(userInput).toHaveValue('alice');

    // Now simulate a failed submit result: pending false + server error
    useActionStateMock.mockReturnValue([{ fieldErrors: {}, serverError: 'Erreur serveur' }, mockAction, false]);
    rerender(<LoginForm/>);

    expect(toast.error).toHaveBeenCalledWith('Erreur serveur');
    expect(userInput).toHaveValue(''); // cleared by useEffect
  });
});
