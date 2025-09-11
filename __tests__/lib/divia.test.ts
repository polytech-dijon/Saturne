/* eslint-disable @typescript-eslint/no-explicit-any */
describe('Divia API', () => {
  let mockInit: jest.Mock;
  let mockFindStop: jest.Mock;
  let mockTotem: jest.Mock;
  let fetchDiviaData: typeof import('@/lib/divia').fetchDiviaData;

  const createTime = (offset: number) => {
    const date = new Date(Date.now() + offset);
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  };

  beforeEach(async () => {
    jest.resetModules();

    mockTotem = jest.fn();
    mockFindStop = jest.fn().mockImplementation(() => ({
      data: {
        id: 'stop-id',
        nom: 'Stop Name',
        ligne_id: 'line-id',
        ligne_nom_commercial: 'Line Name',
        ligne_direction: 'Direction',
      },
      line: {
        data: {
          picto: 'icon-url',
        },
      },
      totem: mockTotem,
    }));

    mockInit = jest.fn().mockResolvedValue(undefined);

    jest.mock('divia-api', () => {
      return class DiviaAPI {
        init = mockInit;
        findStop = mockFindStop;
      };
    });
    fetchDiviaData = (await import('@/lib/divia')).fetchDiviaData;
  });

  it('should initialize API and fetch data on first call', async () => {
    const { date: date1, time: time1 } = createTime(180000);
    const { date: date2, time: time2 } = createTime(480000);

    mockTotem.mockResolvedValue([
      { text: time1, date: date1 },
      { text: time2, date: date2 },
    ]);

    const result = await fetchDiviaData();

    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockFindStop).toHaveBeenCalledTimes(3);
    expect(mockTotem).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
    expect(result.stops!.length).toBe(3);
    expect(result.results!.length).toBe(3);
    expect(result.results![0].length).toBe(2);
    expect(result.results![0][0].text === time1 || result.results![0][1].text === time1).toBe(true);
  });

  it('should use cached data for subsequent calls within TTL', async () => {
    const { date: date1, time: time1 } = createTime(180000);
    mockTotem.mockResolvedValue([
      { text: time1, date: date1 },
    ]);

    const firstResult = await fetchDiviaData();

    mockInit.mockClear();
    mockFindStop.mockClear();
    mockTotem.mockClear();

    // Mock a new result to ensure it's the old one being returned
    mockTotem.mockResolvedValue([
      createTime(1000),
    ]);

    const secondResult = await fetchDiviaData();

    expect(firstResult).toEqual(secondResult);
    expect(mockInit).not.toHaveBeenCalled();
    expect(mockFindStop).not.toHaveBeenCalled();
    expect(mockTotem).not.toHaveBeenCalled();
  });

  it('should fetch fresh data after cache TTL expires', async () => {
    const { date: date1, time: time1 } = createTime(180000);
    mockTotem.mockResolvedValue([
      { text: time1, date: date1 },
    ]);

    const firstResult = await fetchDiviaData();

    expect(mockTotem).toHaveBeenCalledTimes(3);
    expect(firstResult.results![0][0].text).toBe(time1);

    mockTotem.mockClear();
    // Mock Date.now to return a time after cache expiration
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => originalDateNow() + 31000); // 31 seconds later (TTL is 30 seconds)

    const { date: date2, time: time2 } = createTime(480000);
    mockTotem.mockResolvedValue([
      { text: time2, date: date2 },
    ]);

    const newResult = await fetchDiviaData();

    expect(mockTotem).toHaveBeenCalledTimes(3);
    expect(newResult.results![0][0].text).toBe(time2);

    Date.now = originalDateNow;
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockTotem.mockRejectedValue(new Error('API Error'));

    const result = await fetchDiviaData();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.stops).toBeUndefined();
    expect(result.results).toBeUndefined();
    consoleSpy.mockRestore();
  });

  it('sort arrivals by date', async () => {
    const { date: date1, time: time1 } = createTime(480000);
    const { date: date2, time: time2 } = createTime(180000);
    mockTotem.mockResolvedValue([
      { text: time1, date: date1 },
      { text: time2, date: date2 },
    ]);

    const result = await fetchDiviaData();

    expect(result.success).toBe(true);
    expect(result.results?.[0][0].text).toBe(time2);
    expect(result.results?.[0][1].text).toBe(time1);
  });

  describe('Development mode tests (E2E)', () => {
    // Small helpers to reduce repetition and ensure proper cleanup
    const setEnv = (env: 'development' | 'production') => {
      const prevEnv = process.env.NODE_ENV;
      (process.env.NODE_ENV as any) = env;
      return () => {
        (process.env.NODE_ENV as any) = prevEnv;
      };
    };

    const mockCookie = (value?: string) => {
      jest.doMock('next/headers', () => ({
        cookies: async () => ({
          get: () => (value ? { value } : undefined),
        }),
      }));
    };

    const mockDivia = (overrides?: {
      init?: jest.Mock;
      findStop?: jest.Mock;
      totem?: jest.Mock;
    }) => {
      const init = overrides?.init ?? jest.fn().mockResolvedValue(undefined);
      const totem =
        overrides?.totem ?? jest.fn().mockResolvedValue([{ text: '00:00', date: new Date() }]);
      const findStop =
        overrides?.findStop ??
        jest.fn().mockImplementation(() => ({
          data: {
            id: 'stop-id',
            nom: 'Stop Name',
            ligne_id: 'line-id',
            ligne_nom_commercial: 'Line Name',
            ligne_direction: 'Direction',
          },
          line: { data: { picto: 'icon-url' } },
          totem,
        }));

      jest.doMock('divia-api', () => {
        return class DiviaAPI {
          init = init;
          findStop = findStop;
        };
      });

      return { init, findStop, totem };
    };

    const importFetch = async () => (await import('@/lib/divia')).fetchDiviaData;

    it('returns error in dev mode when divia-test is "error"', async () => {
      const restoreEnv = setEnv('development');
      jest.resetModules();
      mockCookie('error');
      const { init, findStop } = mockDivia();

      try {
        const fetchDiviaData = await importFetch();
        const res = await fetchDiviaData();
        expect(res.success).toBe(false);
        expect(res.error).toBeDefined();
        // In dev error mode, the API should not be called at all
        expect(init).not.toHaveBeenCalled();
        expect(findStop).not.toHaveBeenCalled();
      } finally {
        jest.dontMock('next/headers');
        jest.dontMock('divia-api');
        jest.resetModules();
        restoreEnv();
      }
    });

    it('returns incomplete data in dev mode when divia-test is "incomplete"', async () => {
      const restoreEnv = setEnv('development');
      jest.resetModules();
      mockCookie('incomplete');
      const { init, findStop } = mockDivia();

      try {
        const fetchDiviaData = await importFetch();
        const res = await fetchDiviaData();
        expect(res.success).toBe(true);
        expect(res.stops).toBeDefined();
        expect(res.results).toBeDefined();
        // Exactly 2 (less than the normal 3)
        expect(res.stops!.length).toBe(2);
        expect(res.results!.length).toBe(2);
        // No external API calls in this dev shortcut path
        expect(init).not.toHaveBeenCalled();
        expect(findStop).not.toHaveBeenCalled();
      } finally {
        jest.dontMock('next/headers');
        jest.dontMock('divia-api');
        jest.resetModules();
        restoreEnv();
      }
    });

    it('delays ~1s in dev mode when divia-test is "delay"', async () => {
      const restoreEnv = setEnv('development');
      jest.resetModules();
      mockCookie('delay');
      const { init, findStop } = mockDivia();

      try {
        const start = Date.now();
        const fetchDiviaData = await importFetch();
        const res = await fetchDiviaData();
        const elapsed = Date.now() - start;

        // Should add an artificial ~1s delay
        expect(elapsed).toBeGreaterThanOrEqual(900);
        expect(res.success).toBe(true);
        expect(res.stops?.length).toBe(3);
        expect(res.results?.length).toBe(3);
        // No external API calls in this dev shortcut path
        expect(init).not.toHaveBeenCalled();
        expect(findStop).not.toHaveBeenCalled();
      } finally {
        jest.dontMock('next/headers');
        jest.dontMock('divia-api');
        jest.resetModules();
        restoreEnv();
      }
    });

    it('unknown dev cookie value falls back to normal flow (development)', async () => {
      const restoreEnv = setEnv('development');
      jest.resetModules();
      mockCookie('foobar');
      const init = jest.fn().mockResolvedValue(undefined);
      const totem = jest.fn().mockResolvedValue([{ text: '00:00', date: new Date() }]);
      const findStop = jest.fn().mockImplementation(() => ({
        data: {
          id: 'stop-id',
          nom: 'Stop Name',
          ligne_id: 'line-id',
          ligne_nom_commercial: 'Line Name',
          ligne_direction: 'Direction',
        },
        line: { data: { picto: 'icon-url' } },
        totem,
      }));
      mockDivia({ init, findStop, totem });

      try {
        const fetchDiviaData = await importFetch();
        const res = await fetchDiviaData();
        expect(init).toHaveBeenCalled();
        expect(totem).toHaveBeenCalled();
        expect(res.success).toBe(true);
      } finally {
        jest.dontMock('next/headers');
        jest.dontMock('divia-api');
        jest.resetModules();
        restoreEnv();
      }
    });

    it('unknown production cookie value has no effect (no delay)', async () => {
      const restoreEnv = setEnv('production');
      jest.resetModules();
      mockCookie('foobar');
      const init = jest.fn().mockResolvedValue(undefined);
      const totem = jest.fn().mockResolvedValue([{ text: 'some', date: new Date() }]);
      const findStop = jest.fn().mockImplementation(() => ({
        data: {
          id: 'stop-id',
          nom: 'Stop Name',
          ligne_id: 'line-id',
          ligne_nom_commercial: 'Line Name',
          ligne_direction: 'Direction',
        },
        line: { data: { picto: 'icon-url' } },
        totem,
      }));
      mockDivia({ init, findStop, totem });

      try {
        const start = Date.now();
        const fetchDiviaData = await importFetch();
        const res = await fetchDiviaData();
        const elapsed = Date.now() - start;

        expect(elapsed).toBeLessThan(500);
        expect(res.success).toBe(true);
      } finally {
        jest.dontMock('next/headers');
        jest.dontMock('divia-api');
        jest.resetModules();
        restoreEnv();
      }
    });

    it('production mode ignores "error" cookie (dev hook is disabled in prod)', async () => {
      const restoreEnv = setEnv('production');
      jest.resetModules();
      mockCookie('error');
      const init = jest.fn().mockResolvedValue(undefined);
      const totem = jest.fn().mockResolvedValue([{ text: 'ok', date: new Date() }]);
      const findStop = jest.fn().mockImplementation(() => ({
        data: {
          id: 'stop-id',
          nom: 'Stop Name',
          ligne_id: 'line-id',
          ligne_nom_commercial: 'Line Name',
          ligne_direction: 'Direction',
        },
        line: { data: { picto: 'icon-url' } },
        totem,
      }));
      mockDivia({ init, findStop, totem });

      try {
        const fetchDiviaData = await importFetch();
        const res = await fetchDiviaData();
        expect(res.success).toBe(true);
        // Normal flow should call the API
        expect(init).toHaveBeenCalled();
        expect(findStop).toHaveBeenCalled();
      } finally {
        jest.dontMock('next/headers');
        jest.dontMock('divia-api');
        jest.resetModules();
        restoreEnv();
      }
    });
  });
});
