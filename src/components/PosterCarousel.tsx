'use client';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import { Poster } from '@/lib/actions';
import Autoplay from 'embla-carousel-autoplay';

export default function PosterCarousel({ posters }: { posters: Poster[] }) {
  return (
    <Carousel
      className="w-full"
      opts={{
        loop: true,
        duration: 60,
      }}
      plugins={[
        Autoplay({
          delay: 5000,
          stopOnInteraction: false,
        }),
      ]}>
      <CarouselContent className="-ml-[10/3vw]">
        {posters.map((poster) => (
          <CarouselItem key={poster.id} className="basis-1/3 pl-[5/3vw] flex items-center justify-center">
            <Image src={poster.image} alt={poster.title} width={800} height={400} className="w-[30vw]" />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
