import { getPosters } from '@/lib/actions';
import PosterCarousel from '@/components/PosterCarousel';
import HomeFooter from '@/components/HomeFooter';
import Divia from '@/components/Divia';

export default async function Home() {
  const posters = await getPosters();
  return (
    <div className="min-h-screen flex justify-between items-center flex-col">
      <div className="w-full h-[20vh]">
        <Divia />
      </div>
      <div className="w-full h-[70vh]">
        <PosterCarousel posters={posters} />
      </div>
      <div className="w-full h-[10vh]">
        <HomeFooter />
      </div>
    </div>
  );
}

