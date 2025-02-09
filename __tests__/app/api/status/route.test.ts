/**
 * @jest-environment node
 */

import { GET } from '@/app/api/status/route';
import { NextResponse } from "next/server";

describe('GET /api/status', () => {
  it('should return status ok', async () => {
    const response = await GET();
    expect(response).toBeInstanceOf(NextResponse);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
