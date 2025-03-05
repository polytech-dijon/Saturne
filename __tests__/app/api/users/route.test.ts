/**
 * @jest-environment node
 */

import { GET } from '@/app/api/users/route';
import { NextResponse } from 'next/server';
import { prismaMock } from '@/lib/mock-prisma';
import { User } from '@prisma/client';

describe('GET /api/users', () => {
  it('should return all users successfully', async () => {
    const mockUsers: User[] = [
      {
        id: 1,
        createdAt: new Date(),
        email: 'alice@prisma.io',
        name: 'Alice',
      }, {
        id: 2,
        createdAt: new Date(),
        email: 'bob@prisma.io',
        name: 'Bob',
      },
    ];

    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(response).toBeInstanceOf(NextResponse);
    const parsedData: User[] = (data as User[]).map(user => ({
      ...user,
      createdAt: new Date(user.createdAt),
    }));
    expect(parsedData).toEqual(mockUsers);
    expect(prismaMock.user.findMany).toHaveBeenCalled();
  });

  it('should handle errors appropriately', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    prismaMock.user.findMany.mockRejectedValue(new Error('Database error'));

    const response = await GET();
    const data = await response.json();

    expect(response).toBeInstanceOf(NextResponse);
    expect(data).toEqual({ error: 'Failed to fetch users' });
    expect(response.status).toBe(500);
    expect(prismaMock.user.findMany).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
