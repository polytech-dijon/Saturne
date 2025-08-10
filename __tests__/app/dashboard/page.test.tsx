import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Page from '@/app/dashboard/page';
import { auth } from '@/auth';

jest.mock('@/auth', () => ({ auth: jest.fn() }));

describe('Page component', () => {
  beforeEach(() => jest.resetAllMocks());

  it('renders nothing when there is no session', async () => {
    (auth as jest.Mock).mockResolvedValue(null);
    const element = await Page();
    render(element as React.ReactElement);

    await waitFor(() => {
      expect(screen.queryByText(/Bonjour,/)).not.toBeInTheDocument();
    });
  });

  it('renders greeting with user name', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { name: 'Alice' } });
    const element = await Page();
    render(element as React.ReactElement);

    expect(await screen.findByText('Bonjour, Alice')).toBeInTheDocument();
  });

  it('renders greeting with invité when name is missing', async () => {
    (auth as jest.Mock).mockResolvedValue({ user: {} });
    const element = await Page();
    render(element as React.ReactElement);

    expect(await screen.findByText('Bonjour, invité')).toBeInTheDocument();
  });
});
