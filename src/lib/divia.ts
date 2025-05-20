'use server';
import DiviaAPI from 'divia-api';

export type Stop = {
  id: string;
  name: string;
  line: {
    id: string;
    name: string;
    direction: string;
    icon: string;
  };
};

export type Arrival = {
  text: string;
};

export type DiviaData = {
  success: boolean;
  error?: string;
  stops?: Stop[];
  results?: Arrival[][];
};

const serverDiviaApi = new DiviaAPI();
let stops: ReturnType<typeof serverDiviaApi.findStop>[] = [];
let initialized = false;

let cachedDiviaData: DiviaData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 1000;

export async function fetchDiviaData(): Promise<DiviaData> {
  const now = Date.now();

  if (cachedDiviaData && now - cacheTimestamp < CACHE_TTL) return cachedDiviaData;

  if (!initialized) {
    await serverDiviaApi.init();
    stops = [
      serverDiviaApi.findStop('T1', 'Université', 'A'),
      serverDiviaApi.findStop('T1', 'Université', 'R'),
      serverDiviaApi.findStop('L5', 'Université', 'A'),
    ];
    initialized = true;
  }

  try {
    const results = await Promise.all(stops.map((stop) => stop.totem()));

    const serializableStops: Stop[] = stops.map(stop => ({
      id: stop.data.id,
      name: stop.data.nom,
      line: {
        id: stop.data.ligne_id,
        name: stop.data.ligne_nom_commercial,
        direction: stop.data.ligne_direction,
        icon: stop.line.data.picto,
      },
    }));

    const serializableArrivals: Arrival[][] = results.map(arrivals =>
      arrivals.sort((arrival1, arrival2) => arrival1.date.getTime() - arrival2.date.getTime()).map(arrival => ({
        text: arrival.text,
      })),
    );

    cachedDiviaData = { success: true, stops: serializableStops, results: serializableArrivals };
    cacheTimestamp = now;
    return cachedDiviaData;
  } catch (error) {
    console.error('Failed to fetch Divia data:', error);
    return { success: false, error: 'Failed to fetch Divia data' };
  }
}
