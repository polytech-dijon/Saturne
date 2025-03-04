'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Arrival, DiviaData, fetchDiviaData, Stop } from '@/lib/divia';

function formatDate(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return 'N/A';
  }

  const delay = timestamp - Date.now();
  const minutes = Math.floor(delay / 1000 / 60);

  if (minutes <= 0) return 'À quai';
  return `${minutes}min`;
}

type DiviaInfo = {
  stop: Stop,
  arrivals: Arrival[],
}[]

export default function Divia() {
  const [diviaInfo, setDiviaInfo] = useState<DiviaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDiviaData = async () => {
    setIsLoading(true);
    setError(null);

    const data: DiviaData = await fetchDiviaData();
    if (!data.success || !data.stops || !data.results)
      setError('Unable to load transportation data');
    else
      setDiviaInfo(data.stops.map((stop, i) => ({ stop, arrivals: data.results?.[i] || [] })));
    setIsLoading(false);
  };

  useEffect(() => {
    loadDiviaData().catch(console.error);

    const interval = setInterval(loadDiviaData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && !diviaInfo) {
    return <div className="p-4 text-center">Loading transportation data...</div>; // TODO Add a skeleton loader
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive mb-2">{error}</p>
        <Button onClick={() => loadDiviaData().catch(console.error)} variant="outline" size="sm">Retry</Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-row items-center justify-around">
      {diviaInfo!.length > 0 && (
        <>
          {diviaInfo!.map(({ stop, arrivals }) => (
            <div key={stop.line.id} className="ligne flex items-center gap-2">
              <img src={stop.line.icon} alt={stop.line.name} className="h-6" />
              <span className="font-medium">{stop.line.direction}:</span>
              {arrivals.map((arrival, i) => (
                <span key={i} className="horaire bg-secondary px-2 py-1 rounded-md text-sm">
                    {formatDate(arrival.timestamp)}
                  </span>
              ))}
            </div>))}
        </>
      )}
    </div>
  );
}
