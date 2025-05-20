import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomeFooter from '@/components/HomeFooter';
import React from 'react';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, className }: { src: string; alt: string; className: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('HomeFooter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    const mockDate = new Date('2023-01-01T15:30:00');
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the component correctly', () => {
    render(<HomeFooter />);

    expect(screen.getByAltText('Logo Saturne')).toBeInTheDocument();
    expect(screen.getByAltText('Logo PolyBytes')).toBeInTheDocument();

    expect(screen.getByText('Saturne')).toBeInTheDocument();

    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('updates time correctly', () => {
    render(<HomeFooter />);

    expect(screen.getByText('15:30')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(screen.getByText('15:31')).toBeInTheDocument();
  });

  it('has correct links', () => {
    render(<HomeFooter />);

    const homeLink = screen.getByRole('link', { name: /Saturne/i });
    expect(homeLink).toHaveAttribute('href', '/');

    const githubLink = screen.getByRole('link', { name: /Logo PolyBytes/i });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/polytech-dijon');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
