import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/lib/prisma.js';
import { hashPassword, generateToken } from '../src/lib/auth.js';

describe('GET /api/v1/auth/me', () => {
  let token;
  let userId;
  let organizationId;

  beforeEach(async () => {
    const org = await prisma.organization.create({
      data: { name: 'Me Test Org', slug: 'me-test-org' }
    });
    organizationId = org.id;
    
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        name: 'Me User',
        email: 'me@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN'
      }
    });
    userId = user.id;

    token = generateToken({
      userId: user.id,
      organizationId: org.id,
      role: user.role
    });
  });

  it('should reject access if no cookie is provided', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should return the current user and organization when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`token=${token}`]);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userId);
    expect(res.body.email).toBe('me@example.com');
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.organization).toBeDefined();
    expect(res.body.organization.id).toBe(organizationId);
    expect(res.body.organization.name).toBe('Me Test Org');
  });

  it('should reject access if token is invalid', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', ['token=invalid.token.string']);
      
    expect(res.status).toBe(401);
  });
});
