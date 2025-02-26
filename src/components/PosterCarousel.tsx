'use client';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import { Poster } from '@/lib/actions';
import Autoplay from 'embla-carousel-autoplay';

export default function PosterCarousel({ posters }: { posters: Poster[] }) {
  return (
    <Carousel
      opts={{
        loop: true,
      }}
      plugins={[
        Autoplay({
          delay: 2000,
          stopOnInteraction: false,
        }),
      ]}>
      <CarouselContent className="-ml-4">
        {posters.map((poster) => (
          <CarouselItem key={poster.id} className="basis-1/3 pl-4 flex items-center">
            <Image src={poster.image} alt="poster" width={800} height={400} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
