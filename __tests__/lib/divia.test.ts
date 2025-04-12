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

  it('should sort arrivals by date', async () => {
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
});
