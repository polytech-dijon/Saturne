'use client';
import PolyBytes from '@/../public/polybytes.png';
import Saturne from '@/../public/saturne.png';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeFooter() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    const calculateTimeToNextMinute = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();
      return (60 - seconds) * 1000 - milliseconds;
    };

    updateTime();

    const timeout = setTimeout(() => {
      updateTime();
      const interval = setInterval(updateTime, 60000);
      return () => clearInterval(interval);
    }, calculateTimeToNextMinute());

    return () => clearTimeout(timeout);
  }, []);

  return (
    <footer className="relative flex items-center justify-between h-full w-full">
      <Link href="/" className="flex flex-row items-center ml-[2dvw] relative top-3 sm:top-0">
        <Image src={Saturne} alt="Logo Saturne" className="w-auto h-[4dvh] sm:h-[8dvh]" />
        <p className="text-lg sm:text-3xl font-medium m-2">Saturne</p>
      </Link>
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:block hidden">
        <p className="text-3xl font-medium">{currentTime}</p>
      </div>
      <a href="https://github.com/polytech-dijon" target="_blank" rel="noopener noreferrer">
        <Image src={PolyBytes} alt="Logo PolyBytes"
               className="w-auto h-[4dvh] sm:h-[6dvh] mr-[2dvw] relative top-3 sm:top-0"
               priority />
      </a>
    </footer>
  );
}
