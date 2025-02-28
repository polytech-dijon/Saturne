'use client';
import { useEffect, useState } from 'react';
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import { Poster } from '@/lib/actions';
import Autoplay from 'embla-carousel-autoplay';
import AutoHeight from 'embla-carousel-auto-height';

export default function PosterCarousel({ posters }: { posters: Poster[] }) {
    const transitionDuration = 1000;
    const posterDuration = 5000; // TODO update when each poster has its own duration
    const [api, setApi] = useState<CarouselApi>();

    useEffect(() => {
        if (!api) return;

        let scaleTimer: NodeJS.Timeout;
        let scaleOutTimer: NodeJS.Timeout;
        const scale = () => {
            const previous = api.slideNodes()[api.previousScrollSnap()].firstChild as HTMLElement;
            previous.style.zIndex = '-1';

            const selected = api.slideNodes()[api.selectedScrollSnap()].firstChild as HTMLElement;
            selected.style.zIndex = '1';
            selected.style.transform = 'scale(2)';

            scaleOutTimer = setTimeout(() => {
                selected.style.transform = '';
            }, posterDuration - transitionDuration);
        };
        scale();

        const handleAutoPlay = () => {
            scaleTimer = setTimeout(scale, transitionDuration);
        };
        api.on('autoplay:timerset', handleAutoPlay);

        const handleScroll = () => {
            if (!api.scrollProgress()) return;
            clearTimeout(scaleTimer);
            clearTimeout(scaleOutTimer);
            api.slideNodes().forEach((slide) => {
                (slide.firstChild as HTMLElement).style.transform = '';
            });
        };
        api.on('pointerDown', handleScroll);

        const handleScrollEnd = () => {
            scale();
        };
        api.on('pointerUp', handleScrollEnd);

        return () => {
            api.off('autoplay:timerset', handleAutoPlay);
            api.off('pointerDown', handleScroll);
            api.off('pointerUp', handleScrollEnd);
            clearTimeout(scaleTimer);
            clearTimeout(scaleOutTimer);
        };
    }, [api]);

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
            <CarouselContent className="-ml-[10/3vw] items-center h-[60vh]">
                {posters.map((poster) => (
                    <CarouselItem key={poster.id}
                                  className="basis-1/3">
                        <Image src={poster.image} alt={poster.title} width={800} height={400}
                               className="pl-[5/3vw] max-w-[30vw] max-h-[30vh] transition-transform duration-1000 ease-[ease] relative z-[-1]" />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
