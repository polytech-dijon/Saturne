import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Image from 'next/image';
import { Poster } from '@/lib/actions';

export default function PosterCarousel({ posters }: { posters: Poster[] }) {
  return (
    <Carousel
      opts={{
        loop: true,
      }}>
      <CarouselContent className="-ml-8">
        {posters.map((poster) => (
          <CarouselItem key={poster.id} className="basis-1/3 pl-8 flex items-center">
            <Image src={poster.image} alt="poster" width={800} height={400} />
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
