'use client';
import React, { Fragment, useEffect, useState } from 'react';
import { Arrival, DiviaData, fetchDiviaData, Stop } from '@/lib/divia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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
}[];

function CardWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-full">
      <Card className="gap-0 border-0 h-full max-h-40 2xl:max-h-50 w-full
                       max-w-[90dvw] sm:max-w-150 md:max-w-180 lg:max-w-200 xl:max-w-250 2xl:max-w-300
                       relative left-1/2 top-[12.5dvh] transform -translate-x-1/2 -translate-y-1/2 py-0
                       overflow-hidden">
        <ScrollArea className="h-full [&>div]:flex [&>div]:items-center">
          <div className="flex flex-row justify-center items-center">
            {children}
          </div>
          <ScrollBar orientation="horizontal" className="opacity-50" />
        </ScrollArea>
      </Card>
    </div>
  );
}

function ItemWrapper({ header, content }: { header: React.ReactNode, content: React.ReactNode }) {
  return (
    <div className="h-full flex justify-center items-center sm:basis-1/3 px-6">
      <div className="h-full flex flex-col justify-around gap-2 2xl:gap-4">
        <CardHeader className="px-0">
          <div className="flex items-center gap-2">
            {header}
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex flex-row gap-2">
            {content}
          </div>
        </CardContent>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <CardWrapper>
      {[0, 1, 2].map((index) => (
        <Fragment key={index}>
          {index > 0 && <div className="h-25"><Separator orientation="vertical" className="rounded-full" /></div>}
          <ItemWrapper
            header={
              <>
                <Skeleton className="h-10 w-15 rounded-md bg-muted-foreground" />
                <div>
                  <Skeleton className="h-5 w-30 mb-1 bg-foreground" />
                  <Skeleton className="h-3 w-20 bg-muted-foreground" />
                </div>
              </>}
            content={
              [0, 1].map((i) => (
                <Skeleton key={i} className="h-5 w-14 rounded-full bg-primary" />
              ))} />
        </Fragment>
      ))}
    </CardWrapper>
  );
}

function DataCard({ diviaInfo }: { diviaInfo: DiviaInfo }) {
  return (
    <CardWrapper>
      {diviaInfo.map(({ stop, arrivals }, index) => (
        <Fragment key={`${stop.line.id}-${stop.line.direction}`}>
          {index > 0 &&
            <div className="h-25 2xl:h-30"><Separator orientation="vertical" className="rounded-full" /></div>}
          <ItemWrapper
            header={
              <>
                <div className="flex items-center bg-muted-foreground p-1.5 2xl:p-2 rounded-md">
                  <img src={stop.line.icon} alt={stop.line.name} className="h-6 2xl:h-10 rounded-[0.3rem]" />
                </div>
                <div>
                  <CardTitle className="2xl:text-2xl">{stop.line.direction.split(' ').slice(0, 2).join(' ')}</CardTitle>
                  <CardDescription className="2xl:text-xl">{stop.name}</CardDescription>
                </div>
              </>}
            content={
              arrivals.length > 0 ? (
                <div className="flex flex-row gap-2">
                  {arrivals.map((arrival, i) => {
                    const formattedTime = formatDate(arrival.text);
                    return (
                      <Badge key={i} className="2xl:text-lg rounded-full">
                        <span className={`h-2 w-2 2xl:h-3 2xl:w-3 rounded-full ${
                          formattedTime === 'À quai' ? 'bg-green-500' :
                            !formattedTime.includes('h') ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        {formattedTime}
                      </Badge>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No upcoming arrivals</div>
              )} />
        </Fragment>
      ))}
    </CardWrapper>
  );
}

export default function Divia() {
  const [diviaInfo, setDiviaInfo] = useState<DiviaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDiviaData = async () => {
    setError(null);
    const data: DiviaData = await fetchDiviaData();

    if (!data.success || !data.stops || !data.results) setError('Unable to load transportation data');
    else setDiviaInfo(data.stops.map((stop, i) => ({ stop, arrivals: data.results?.[i] || [] })));
  };

  useEffect(() => {
    loadDiviaData().catch(console.error);
    const interval = setInterval(loadDiviaData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (error || (diviaInfo && diviaInfo.length !== 3)) {
    return (
      <Alert variant="destructive"
             className="mx-auto w-[30dvw] left-1/2 top-[12.5dvh] absolute transform -translate-x-1/2 -translate-y-1/2
                        border-destructive-foreground bg-background">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading transportation data</AlertTitle>
        <AlertDescription>
          {error || (diviaInfo ? 'Incomplete station data received.' : 'No data available.')}
        </AlertDescription>
      </Alert>
    );
  }

  if (!diviaInfo) return <SkeletonCard />;

  return <DataCard diviaInfo={diviaInfo} />;
}
