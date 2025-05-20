import { getPosters } from '@/lib/actions';

global.fetch = jest.fn();

process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

describe('getPosters', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should return transformed posters on successful API call', async () => {
    const mockApiResponse = {
      ok: true,
      data: [
        {
          id: 1,
          title: 'Poster 1',
          event_date: '2023-05-01',
          image: 'poster1.jpg',
          background_color: '#FFFFFF',
        },
        {
          id: 2,
          title: 'Poster 2',
          event_date: null,
          image: 'poster2.jpg',
          background_color: null,
        },
      ],
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await getPosters();

    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/poster');

    expect(result).toEqual([
      {
        id: 1,
        title: 'Poster 1',
        image: 'https://api.example.com/uploads/poster1.jpg',
      },
      {
        id: 2,
        title: 'Poster 2',
        image: 'https://api.example.com/uploads/poster2.jpg',
      },
    ]);
  });

  it('should throw an error when the API request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(getPosters()).rejects.toThrow('Failed to fetch posters: 404 Not Found');
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/poster');
  });

  it('should throw an error when API returns invalid response format', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: false, data: null }),
    });

    await expect(getPosters()).rejects.toThrow('Invalid response format from API');
  });

  it('should throw an error when API data is not an array', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, data: 'not an array' }),
    });

    await expect(getPosters()).rejects.toThrow('Invalid response format from API');
  });
});
