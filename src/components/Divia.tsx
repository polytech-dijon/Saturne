'use client';
import { Fragment, useEffect, useState } from 'react';
import { Arrival, DiviaData, fetchDiviaData, Stop } from '@/lib/divia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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

  if (error || diviaInfo?.length !== 3) {
    return (
      <Alert variant="destructive"
             className="mx-auto w-[30vw] left-1/2 top-[12.5vh] absolute transform -translate-x-1/2 -translate-y-1/2
                        border-destructive-foreground bg-background">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading transportation data</AlertTitle>
        <AlertDescription>
          {error || (diviaInfo ? 'Incomplete station data received.' : 'No data available.')}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Card className="border-0 flex-row justify-around items-center h-full max-h-40 w-full max-w-[70vw] gap-0
                       absolute left-1/2 top-[12.5vh] transform -translate-x-1/2 -translate-y-1/2">
        {diviaInfo && diviaInfo.map(({ stop, arrivals }, index) => (
          <Fragment key={`${stop.line.id}-${stop.line.direction}`}>
            {index > 0 && <div className="h-full"><Separator orientation="vertical" className="rounded-full" /></div>}
            <div className="h-full flex flex-col justify-around">
              <CardHeader>
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
              <CardContent>
                {arrivals.length > 0 ? (
                  <div className="flex flex-row gap-2">
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
            </div>
          </Fragment>
        ))}
      </Card>
    </div>
  );
}
