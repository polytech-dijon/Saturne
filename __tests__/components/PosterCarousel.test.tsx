import { render, screen, act, waitFor } from '@testing-library/react';
import { PosterCarousel, SkeletonCarousel } from '@/components/PosterCarousel';
import { Poster } from '@/lib/actions';
import '@testing-library/jest-dom';
import { ReactNode, useEffect } from 'react';

let mockApi: any;
jest.mock('@/components/ui/carousel', () => {
  return {
    Carousel: ({ children, setApi, className }: any) => {
      useEffect(() => {
        if (setApi) {
          mockApi = {
            selectedScrollSnap: jest.fn().mockReturnValue(0),
            slideNodes: jest.fn().mockReturnValue([
              { style: {}, firstChild: { style: {} } },
              { style: {}, firstChild: { style: {} } },
            ]),
            on: jest.fn(),
            off: jest.fn(),
          };
          setApi(mockApi);
        }
      }, []);
      return <div data-testid="carousel" className={className}>{children}</div>;
    },
    CarouselContent: ({ children, className }: any) => <div data-testid="carousel-content"
                                                            className={className}>{children}</div>,
    CarouselItem: ({ children, className }: any) =>
      <div data-testid={`carousel-item`} className={className}>
        <div data-testid="carousel-item-content">
          {children}
        </div>
      </div>,
  };
});

jest.mock('embla-carousel-autoplay', () => {
  return jest.fn().mockImplementation(() => ({}));
});

jest.useFakeTimers();

describe('SkeletonCarousel', () => {
  it('renders the skeleton with correct number of items', () => {
    render(<SkeletonCarousel />);
    expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
  });
});

describe('PosterCarousel', () => {
  const mockPosters: Poster[] = [
    { id: 1, title: 'Poster 1', image: '/poster1.jpg' },
    { id: 2, title: 'Poster 2', image: '/poster2.jpg' },
    { id: 3, title: 'Poster 3', image: '/poster3.jpg' },
  ];

  it('renders posters correctly', async () => {
    await act(async () => {
      render(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(mockPosters))} />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('carousel')).toBeInTheDocument();
      expect(screen.getByTestId('carousel-content')).toBeInTheDocument();
      expect(screen.getAllByTestId('carousel-item')).toHaveLength(3);
    });
  });

  it('applies correct responsive classes based on poster count', async () => {
    let rerender: (ui: ReactNode) => void;
    await act(async () => {
      rerender = render(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(mockPosters))} />).rerender;
    });

    // With 3 posters, should use sm:basis-1/2
    expect(screen.getAllByTestId('carousel-item')[0].className).toContain('sm:basis-1/2');

    // Test with more than 4 posters
    const manyPosters: Poster[] = [
      ...mockPosters,
      { id: 4, title: 'Poster 4', image: '/poster4.jpg' },
      { id: 5, title: 'Poster 5', image: '/poster5.jpg' },
    ];

    await act(async () => {
      rerender(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(manyPosters))} />);
    });
    // With 5 posters, should use sm:basis-1/3
    expect(screen.getAllByTestId('carousel-item')[0].className).toContain('sm:basis-1/3');

    // Test with 2 posters
    const fewPosters = mockPosters.slice(0, 2);
    await act(async () => {
      rerender(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(fewPosters))} />);
    });
    // With 2 posters, should use sm:basis-full
    expect(screen.getAllByTestId('carousel-item')[0].className).toContain('sm:basis-full');
  });

  it('applies and removes transform scale on selected slide', async () => {
    await act(async () => {
      render(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(mockPosters))} />);
    });

    // Verify initial transform scale is applied
    expect(mockApi.slideNodes()[0].firstChild.style.transform).toBe('scale(2)');
    expect(mockApi.slideNodes()[0].style.zIndex).toBe('1');

    // Fast-forward to just before scale removal
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    // Verify transform is removed near the end of the poster duration
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockApi.slideNodes()[0].firstChild.style.transform).toBe('');
  });

  it('handles pointer events correctly', async () => {
    await act(async () => {
      render(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(mockPosters))} />);
    });

    // Simulate pointer down
    const pointerDownHandler = mockApi.on.mock.calls.find((call: string[]) => call[0] === 'pointerDown')[1];
    act(() => {
      pointerDownHandler();
    });

    // Verify transforms are cleared
    expect(mockApi.slideNodes()[0].firstChild.style.transform).toBe('');

    // Simulate pointer up
    const pointerUpHandler = mockApi.on.mock.calls.find((call: string[]) => call[0] === 'pointerUp')[1];
    act(() => {
      pointerUpHandler();
    });

    // Verify transform is reapplied
    expect(mockApi.slideNodes()[0].firstChild.style.transform).toBe('scale(2)');
    expect(mockApi.slideNodes()[0].style.zIndex).toBe('1');
  });

  it('triggers scale on autoplay:timerset event', async () => {
    await act(async () => {
      render(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(mockPosters))} />);
    });

    const call = mockApi.on.mock.calls.find((call: any[]) => call[0] === 'autoplay:timerset');
    const autoplayHandler = call && call[1];
    expect(typeof autoplayHandler).toBe('function');

    act(() => {
      autoplayHandler(); // Simulate the autoplay event
      jest.advanceTimersByTime(1000); // advance by transitionDuration
    });
    // Verify that the selected slide gets scaled
    expect(mockApi.slideNodes()[0].firstChild.style.transform).toBe('scale(2)');
  });

  it('resets zIndex of all slides to 0 after transition duration on pointerDown event', async () => {
    await act(async () => {
      render(<PosterCarousel posters={new Promise<Poster[]>(resolve => resolve(mockPosters))} />);
    });

    // Find and trigger the pointerDown event handler to start zIndex reset timer
    const pointerDownHandler = mockApi.on.mock.calls.find(
      (call: any[]) => call[0] === 'pointerDown',
    )?.[1];
    act(() => {
      pointerDownHandler && pointerDownHandler();
    });

    // Fast-forward the timer to run the resetZIndexTimer callback
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Verify that all slides have their zIndex reset to '0'
    mockApi.slideNodes().forEach((slide: HTMLElement) => {
      expect(slide.style.zIndex).toBe('0');
    });
  });
});

