import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';
import React from 'react';

jest.mock('@/lib/actions', () => ({
  getPosters: jest.fn(() => []),
}));

jest.mock('@/components/HomeFooter', () => ({
  __esModule: true,
  default: () => <div data-testid="home-footer">Mock Footer</div>,
}));

jest.mock('@/components/Divia', () => ({
  __esModule: true,
  default: () => <div data-testid="divia">Mock Divia</div>,
}));

jest.mock('@/components/PosterCarousel', () => ({
  PosterCarousel: () => <div data-testid="poster-carousel">Mock Carousel</div>,
  SkeletonCarousel: () => <div data-testid="skeleton-carousel">Mock Skeleton</div>,
}));

// Mock Suspense to simply render its children
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    Suspense: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('Home Page', () => {
  it('renders the Divia component', async () => {
    render(await Home());
    expect(screen.getByTestId('divia')).toBeInTheDocument();
  });

  it('renders the PosterCarousel component', async () => {
    render(await Home());
    expect(screen.getByTestId('poster-carousel')).toBeInTheDocument();
  });

  it('renders the HomeFooter component', async () => {
    render(await Home());
    expect(screen.getByTestId('home-footer')).toBeInTheDocument();
  });

  it('has the correct layout structure', async () => {
    const { container } = render(await Home());
    expect(container.firstChild).toHaveClass('min-h-[100dvh]');
  });

  it('applies the correct height to the Divia section', async () => {
    render(await Home());
    const diviaContainer = screen.getByTestId('divia').parentElement;
    expect(diviaContainer).toHaveClass('h-[20dvh]');
  });

  it('applies the correct height to the PosterCarousel section', async () => {
    render(await Home());
    const carouselContainer = screen.getByTestId('poster-carousel').parentElement;
    expect(carouselContainer).toHaveClass('h-[70dvh]');
  });

  it('applies the correct height to the HomeFooter section', async () => {
    render(await Home());
    const footerContainer = screen.getByTestId('home-footer').parentElement;
    expect(footerContainer).toHaveClass('h-[10dvh]');
  });
});
