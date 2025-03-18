import { getPosters } from '@/lib/actions';
import HomeFooter from '@/components/HomeFooter';
import Divia from '@/components/Divia';
import { Suspense } from 'react';
import { PosterCarousel, SkeletonCarousel } from '@/components/PosterCarousel';

export default async function Home() {
  const posters = getPosters();
  return (
    <div className="min-h-[100dvh] flex justify-between items-center flex-col">
      <div className="w-full h-[20dvh]">
        <Divia />
      </div>
      <div className="w-full h-[70dvh]">
        <Suspense fallback={<SkeletonCarousel />}>
          <PosterCarousel posters={posters} />
        </Suspense>
      </div>
      <div className="w-full h-[10dvh]">
        <HomeFooter />
      </div>
    </div>
  );
}

