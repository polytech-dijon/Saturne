import { jest } from '@jest/globals';

const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('@/auth', () => ({
  handlers: {
    GET: mockGet,
    POST: mockPost,
  },
}));

import { GET, POST } from '@/app/api/auth/[...nextauth]/route';
import { handlers } from '@/auth';

describe('API auth/[...nextauth]/route.ts', () => {
  it('should re-export GET from handlers', () => {
    expect(typeof GET).toBe('function');
    expect(GET).toBe(handlers.GET);
  });

  it('should re-export POST from handlers', () => {
    expect(typeof POST).toBe('function');
    expect(POST).toBe(handlers.POST);
  });
});
