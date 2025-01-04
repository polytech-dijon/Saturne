import request from 'supertest';
import app from './status';

describe('GET /api', () => {
  it('should return a 200 status and a message', async () => {
    const response = await request(app).get('/api');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(200);
  });
});
