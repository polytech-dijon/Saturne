import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import Divia from '@/components/Divia';
import { fetchDiviaData } from '@/lib/divia';
import '@testing-library/jest-dom';

jest.mock('@/lib/divia', () => ({
    fetchDiviaData: jest.fn(),
}));

const createMockDiviaData = (success = true) => ({
    success,
    stops: success ? [
        {
            name: 'Université',
            line: {
                id: 'T1',
                name: 'Tram T1',
                direction: 'Quetigny Centre',
                icon: '/images/lines/t1.png',
            },
        },
        {
            name: 'Université',
            line: {
                id: 'T1',
                name: 'Tram T1',
                direction: 'Dijon Gare',
                icon: '/images/lines/t1.png',
            },
        },
        {
            name: 'Université',
            line: {
                id: 'L5',
                name: 'Bus L5',
                direction: 'Talant Dulin',
                icon: '/images/lines/l5.png',
            },
        },
    ] : null,
    results: success ? [
        [{ text: '12:30' }, { text: '12:45' }],
        [{ text: '12:35' }],
        [{ text: '12:40' }, { text: '13:00' }],
    ] : null,
});

describe('Divia Component', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2023-01-01T12:15:00'));
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders loading skeleton initially', () => {
        (fetchDiviaData as jest.Mock).mockImplementation(() => new Promise(() => {
        })); // Never resolves

        render(<Divia />);

        expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0);
    });

    test('displays error message when data fetch fails', async () => {
        (fetchDiviaData as jest.Mock).mockResolvedValue({ success: false });

        render(<Divia />);

        await waitFor(() => {
            expect(screen.getByText('Error loading transportation data')).toBeInTheDocument();
            expect(screen.getByText('Unable to load transportation data')).toBeInTheDocument();
        });
    });

    test('displays error when incomplete data is received', async () => {
        const incompleteData = createMockDiviaData(true);
        incompleteData.stops?.pop(); // Remove one stop to make data incomplete

        (fetchDiviaData as jest.Mock).mockResolvedValue(incompleteData);

        render(<Divia />);

        await waitFor(() => {
            expect(screen.getByText('Error loading transportation data')).toBeInTheDocument();
            expect(screen.getByText('Incomplete station data received.')).toBeInTheDocument();
        });
    });

    test('displays transportation data correctly', async () => {
        (fetchDiviaData as jest.Mock).mockResolvedValue(createMockDiviaData());

        render(<Divia />);

        await waitFor(() => {
            expect(screen.getAllByText('Université')).toHaveLength(3);
            expect(screen.getByText('Quetigny Centre')).toBeInTheDocument();
            expect(screen.getByText('Dijon Gare')).toBeInTheDocument();
            expect(screen.getByText('Talant Dulin')).toBeInTheDocument();

            expect(screen.getByText('15min')).toBeInTheDocument(); // 12:30 - 12:15
            expect(screen.getByText('30min')).toBeInTheDocument(); // 12:45 - 12:15
            expect(screen.getByText('20min')).toBeInTheDocument(); // 12:35 - 12:15
            expect(screen.getByText('25min')).toBeInTheDocument(); // 12:40 - 12:15
            expect(screen.getByText('45min')).toBeInTheDocument(); // 13:00 - 12:15
        });
    });

    test('refreshes data every 30 seconds', async () => {
        (fetchDiviaData as jest.Mock).mockResolvedValue(createMockDiviaData());

        render(<Divia />);

        await waitFor(() => {
            expect(fetchDiviaData).toHaveBeenCalledTimes(1);
        });

        act(() => {
            jest.advanceTimersByTime(30000);
        });

        await waitFor(() => {
            expect(fetchDiviaData).toHaveBeenCalledTimes(2);
        });

        act(() => {
            jest.advanceTimersByTime(30000);
        });

        await waitFor(() => {
            expect(fetchDiviaData).toHaveBeenCalledTimes(3);
        });
    });

    test('formats arrival time correctly', async () => {
        // Mock implementation to test different time formats
        (fetchDiviaData as jest.Mock).mockResolvedValue({
            success: true,
            stops: [
                {
                    name: 'Test Stop 1',
                    line: { id: 'T1', name: 'Test Line 1', direction: 'Test Direction 1', icon: '/test1.png' },
                },
                {
                    name: 'Test Stop 2',
                    line: { id: 'T2', name: 'Test Line 2', direction: 'Test Direction 2', icon: '/test2.png' },
                },
                {
                    name: 'Test Stop 3',
                    line: { id: 'T3', name: 'Test Line 3', direction: 'Test Direction 3', icon: '/test3.png' },
                },
            ],
            results: [
                [{ text: '12:15' }], // "À quai"
                [{ text: '12:45' }], // "30min"
                [{ text: '13:20' }], // "1h5min"
            ],
        });

        render(<Divia />);

        await waitFor(() => {
            expect(screen.getByText('À quai')).toBeInTheDocument();
            expect(screen.getByText('30min')).toBeInTheDocument();
            expect(screen.getByText('1h5min')).toBeInTheDocument();
        });
    });

    test('handles invalid time formats', async () => {
        (fetchDiviaData as jest.Mock).mockResolvedValue({
            success: true,
            stops: [
                {
                    name: 'Test Stop 1',
                    line: { id: 'T1', name: 'Test Line 1', direction: 'Test Direction 1', icon: '/test1.png' },
                },
                {
                    name: 'Test Stop 2',
                    line: { id: 'T2', name: 'Test Line 2', direction: 'Test Direction 2', icon: '/test2.png' },
                },
                {
                    name: 'Test Stop 3',
                    line: { id: 'T3', name: 'Test Line 3', direction: 'Test Direction 3', icon: '/test3.png' },
                },
            ],
            results: [
                [{ text: 'Invalid' }], // Should show N/A
                [{ text: '12:45' }],   // Normal
                [{ text: '' }],        // Should show N/A
            ],
        });

        render(<Divia />);

        await waitFor(() => {
            expect(screen.getByText('30min')).toBeInTheDocument();
            expect(screen.getAllByText('N/A')).toHaveLength(2);
        });
    });

    test('handles arrival time after midnight', async () => {
        // Set system time to 23:55 to simulate a time right before midnight.
        jest.setSystemTime(new Date('2023-01-01T23:55:00'));

        (fetchDiviaData as jest.Mock).mockResolvedValue({
            success: true,
            stops: [
                {
                    name: 'Test Stop 1',
                    line: { id: 'T1', name: 'Test Line 1', direction: 'After Midnight', icon: '/test1.png' },
                },
                {
                    name: 'Test Stop 2',
                    line: { id: 'T2', name: 'Test Line 2', direction: 'Intermediate', icon: '/test2.png' },
                },
                {
                    name: 'Test Stop 3',
                    line: { id: 'T3', name: 'Test Line 3', direction: 'Regular', icon: '/test3.png' },
                },
            ],
            results: [
                [{ text: '00:10' }], // 15min after 23:55
                [{ text: '23:58' }], // 3min after 23:55
                [{ text: '00:00' }], // 5min after 23:55
            ],
        });

        render(<Divia />);

        await waitFor(() => {
            expect(screen.getByText('15min')).toBeInTheDocument();
            expect(screen.getByText('3min')).toBeInTheDocument();
            expect(screen.getByText('5min')).toBeInTheDocument();
        });
    });
});
