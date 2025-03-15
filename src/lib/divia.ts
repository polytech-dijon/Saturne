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

export async function fetchDiviaData(): Promise<DiviaData> {
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
      arrivals.map(arrival => ({
        text: arrival.text,
      })),
    );

    return { success: true, stops: serializableStops, results: serializableArrivals };
  } catch (error) {
    console.error('Failed to fetch Divia data:', error);
    return { success: false, error: 'Failed to fetch Divia data' };
  }
}
