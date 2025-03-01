'use client';
import { useEffect, useState } from 'react';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Poster } from '@/lib/actions';
import Autoplay from 'embla-carousel-autoplay';

export default function PosterCarousel({ posters }: { posters: Poster[] }) {
  const transitionDuration = 1000;
  const posterDuration = 5000; // TODO update when each poster has its own duration
  const [api, setApi] = useState<CarouselApi>();

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

      if (posters.length > 1) {
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
  }, [api, posters.length]);

  return (
    <Carousel
      className="w-full h-full flex items-center"
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
      setApi={setApi}>
      <CarouselContent className="-ml-[10/3vw] items-center w-[100vw] h-[60vh]">
        {posters.map((poster) => (
          <CarouselItem key={poster.id}
                        className={`${posters.length > 4 ? 'basis-1/3' : (posters.length > 2 ? 'basis-1/2' : 'basis-full')}`}>
            <div
              className="relative pl-[5/3vw] transition-transform duration-1000 ease-[ease] flex items-center justify-center">
              <img src={poster.image} alt={poster.title} className="h-[30vh] w-auto object-cover rounded-lg" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
