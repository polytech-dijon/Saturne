type ApiPosterResponse = {
  ok: boolean;
  data: {
    id: number;
    title: string;
    event_date: string | null;
    image: string;
    background_color: string | null;
  }[];
};

type Poster = {
  id: number;
  image: string;
}

// Temporary function to fetch posters from the old website's API for testing purposes.
// TODO Will be replaced once the new API is ready.
export async function getPosters(): Promise<Poster[]> {
  const postersJson = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/poster`);
  if (!postersJson.ok) {
    throw new Error(`Failed to fetch posters: ${postersJson.status} ${postersJson.statusText}`);
  }
  const json: ApiPosterResponse = await postersJson.json();
  if (!json.ok || !Array.isArray(json.data)) {
    throw new Error('Invalid response format from API');
  }
  return json.data.map((poster) => ({
    id: poster.id,
    image: `${process.env.NEXT_PUBLIC_API_URL}/uploads/` + poster.image,
  }));
}
