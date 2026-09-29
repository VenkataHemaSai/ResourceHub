import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { hashPassword } from '../src/lib/auth.js';

describe('POST /api/v1/auth/login and logout', () => {
  beforeEach(async () => {
    // Setup a known user for login testing
    const org = await prisma.organization.create({
      data: { name: 'Login Test Org', slug: 'login-test-org' }
    });
    
    await prisma.user.create({
      data: {
        organizationId: org.id,
        name: 'Login User',
        email: 'login@example.com',
        passwordHash: await hashPassword('correctPassword123'),
        role: 'MEMBER'
      }
    });
  });

  it('should successfully login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'correctPassword123',
      });

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('login@example.com');
    expect(res.body.passwordHash).toBeUndefined();
    
    // Check cookie
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/token=.+; Max-Age=259200;.*HttpOnly/); // Verifies 3 days expiration
  });

  it('should return 401 with generic message on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongPassword123',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should return 401 with generic message on wrong email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'correctPassword123',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('should clear the token cookie on logout', async () => {
    const res = await request(app).post('/api/v1/auth/logout');

    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    // Cleared cookie has an expiration date in the past
    expect(cookies[0]).toMatch(/token=;/);
    expect(cookies[0]).toMatch(/Expires=Thu, 01 Jan 1970/);
  });
});
