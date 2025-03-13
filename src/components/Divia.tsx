'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Arrival, DiviaData, fetchDiviaData, Stop } from '@/lib/divia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

function formatDate(text: string): string {
  if (!text || text.length !== 5 || text[2] !== ':') return 'N/A';

  const [arrivalHours, arrivalMinutes] = text.split(':').map(Number);
  const now = new Date();
  const currentHours = now.getHours() === 0 ? 24 : now.getHours();
  const currentMinutes = now.getMinutes();

  const arrivalTimeInMinutes = arrivalHours * 60 + arrivalMinutes;
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  let minutesDifference = arrivalTimeInMinutes - currentTimeInMinutes;

  if (minutesDifference <= 0) return 'À quai';
  if (minutesDifference >= 60) return `${Math.floor(minutesDifference / 60)}h${minutesDifference % 60}min`;
  return `${minutesDifference}min`;
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
    <div className="w-full h-full grid grid-cols-3 items-center">
      {diviaInfo && diviaInfo.map(({ stop, arrivals }) => (
        <div key={`${stop.line.id}-${stop.line.direction}`} className="flex justify-center max-h-[19vh]">
          <Card className="py-4 gap-4 border-0">
            <CardHeader className="px-4">
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center bg-azureish-white p-1.5 rounded-md">
                  <img src={stop.line.icon} alt={stop.line.name} className="h-6 rounded-[0.3rem]" />
                </div>
                <div>
                  <CardTitle>{stop.line.direction.split(' ').slice(0, 2).join(' ')}</CardTitle>
                  <CardDescription>{stop.name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <div className="pl-3 pr-3">
              <Separator />
            </div>
            <CardContent className="px-4">
              {arrivals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {arrivals.map((arrival, i) => (
                    <Badge key={i}>
                      {(() => {
                        const formattedTime = formatDate(arrival.text);
                        return (
                          <>
                          <span className={`h-2 w-2 rounded-full ${
                            formattedTime === 'À quai' ? 'bg-green-500' :
                              !formattedTime.includes('h') ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                            {formattedTime}
                          </>
                        );
                      })()}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center">No upcoming arrivals</div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
