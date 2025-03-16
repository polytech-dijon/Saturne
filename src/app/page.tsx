import { getPosters } from '@/lib/actions';
import HomeFooter from '@/components/HomeFooter';
import Divia from '@/components/Divia';
import { Suspense } from 'react';
import { PosterCarousel, SkeletonCarousel } from '@/components/PosterCarousel';

export default async function Home() {
  const posters = getPosters();
  return (
    <div className="min-h-screen flex justify-between items-center flex-col">
      <div className="w-full h-[20vh]">
        <Divia />
      </div>
      <div className="w-full h-[70vh]">
        <Suspense fallback={<SkeletonCarousel />}>
          <PosterCarousel posters={posters} />
        </Suspense>
      </div>
      <div className="w-full h-[10vh]">
        <HomeFooter />
      </div>
    </div>
  );
}

