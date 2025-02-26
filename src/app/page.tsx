import { getPosters } from '@/lib/actions';
import PosterCarousel from '@/components/PosterCarousel';

export default async function Home() {
  const posters = await getPosters();
  return (
    <div className="min-h-screen flex justify-center items-center">
      <PosterCarousel posters={posters} />
    </div>
  );
}

