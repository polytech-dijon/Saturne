import { getPosters } from '@/lib/actions';
import PosterCarousel from '@/components/PosterCarousel';

export default async function Home() {
  const posters = await getPosters();
  return (
    <div className="min-h-screen flex justify-between items-center flex-col">
      <div className="border-amber-950 border-4 w-full h-[20vh] flex items-center justify-center">Divia</div>
      <PosterCarousel posters={posters} />
      <div className="border-amber-950 border-4 w-full h-[10vh] flex items-center justify-around">
        <p>Logo</p>
        <p>Time</p>
        <p>Creator</p>
      </div>
    </div>
  );
}

