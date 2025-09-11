'use client';
import { use, useEffect, useState } from 'react';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Poster } from '@/lib/actions';
import Autoplay from 'embla-carousel-autoplay';
import { Skeleton } from '@/components/ui/skeleton';

export function SkeletonCarousel() {
  return (
    <div className="w-full h-full flex items-center justify-center" data-testid="skeleton-carousel">
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="pl-4 pr-4 basis-1/3">
            <Skeleton className="h-[35dvh] w-auto rounded-lg bg-muted-foreground"/>
          </div>
        ))}
    </div>
  );
}

export function PosterCarousel({ posters }: { posters: Promise<Poster[]> }) {
  const transitionDuration = 1000;
  const posterDuration = 5000; // TODO update when each poster has its own duration
  const [api, setApi] = useState<CarouselApi>();
  const allPosters = use(posters);

  useEffect(() => {
    if (!api) return;

    let scaleTimer: NodeJS.Timeout;
    let scaleOutTimer: NodeJS.Timeout;
    const scale = () => {
      api.slideNodes().forEach((slide: HTMLElement) => {
        if (slide.firstChild) (slide.firstChild as HTMLElement).style.transform = '';
        slide.style.zIndex = '0';
      });

      const selected = api.slideNodes()[api.selectedScrollSnap()] as HTMLElement;
      selected.style.zIndex = '1';
      if (selected.firstChild) (selected.firstChild as HTMLElement).style.transform = 'scale(2)';

      if (allPosters.length > 1) {
        scaleOutTimer = setTimeout(() => {
          if (selected.firstChild) (selected.firstChild as HTMLElement).style.transform = '';
        }, posterDuration - transitionDuration);
      }
    };
    scale();

    const handleAutoPlay = () => {
      scaleTimer = setTimeout(scale, transitionDuration);
    };
    api.on('autoplay:timerset', handleAutoPlay);

    let resetZIndexTimer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scaleTimer);
      clearTimeout(scaleOutTimer);
      api.slideNodes().forEach((slide: HTMLElement) => {
        if (slide.firstChild) (slide.firstChild as HTMLElement).style.transform = '';
      });
      resetZIndexTimer = setTimeout(() => {
        api.slideNodes().forEach((slide: HTMLElement) => {
          slide.style.zIndex = '0';
        });
      }, transitionDuration);
    };
    api.on('pointerDown', handleScroll);

    const handleScrollEnd = () => {
      scale();
      clearTimeout(resetZIndexTimer);
    };
    api.on('pointerUp', handleScrollEnd);

    return () => {
      api.off('autoplay:timerset', handleAutoPlay);
      api.off('pointerDown', handleScroll);
      api.off('pointerUp', handleScrollEnd);
      clearTimeout(scaleTimer);
      clearTimeout(scaleOutTimer);
      clearTimeout(resetZIndexTimer);
    };
  }, [api, allPosters.length]);

  return (
    <Carousel
      className="w-full h-full flex items-center -translate-y-[2dvh]"
      opts={{
        loop: true,
        duration: 60,
      }}
      plugins={[
        Autoplay({
          delay: posterDuration + transitionDuration,
          stopOnInteraction: false,
        }),
      ]}
      setApi={setApi} data-testid="poster-carousel">
      <CarouselContent className="-ml-0 items-center w-[100dvw] h-[70dvh]">
        {allPosters.map((poster) => (
          <CarouselItem key={poster.id}
                        className={`pl-4 pr-4 basis-full ${allPosters.length > 4 ? 'sm:basis-1/3' : (allPosters.length > 2 ? 'sm:basis-1/2' : 'sm:basis-full')}`}>
            <div
              className="relative transition-transform duration-1000 ease-[ease] flex items-center justify-center">
              <img src={poster.image} alt={poster.title}
                   className="w-auto h-auto max-h-[35dvh] max-w-[48dvw] sm:h-[35dvh] sm:w-auto object-center rounded-lg"/>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
