import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/v1/health', () => {
  it('should return status ok and db up', async () => {
    const res = await request(app).get('/api/v1/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      db: 'up',
    });
  });
});
