'use client';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import { Poster } from '@/lib/actions';
import Autoplay from 'embla-carousel-autoplay';

export default function PosterCarousel({ posters }: { posters: Poster[] }) {
    const transitionDuration = 1000;
    const posterDuration = 5000; // TODO update when each poster has its own duration
    return (
        <Carousel
            className="w-full h-full"
            opts={{
                loop: true,
                duration: 60,
            }}
            plugins={[
                Autoplay({
                    delay: posterDuration - transitionDuration,
                    stopOnInteraction: false,
                }),
            ]}>
            <CarouselContent className="-ml-[10/3vw]">
                {posters.map((poster) => (
                    <CarouselItem key={poster.id}
                                  className="basis-1/3 h-full pl-[5/3vw] flex items-center justify-center">
                        <Image src={poster.image} alt={poster.title} width={800} height={400}
                               className="max-w-[30vw] max-h-[30vh]" />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}
