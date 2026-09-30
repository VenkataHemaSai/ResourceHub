import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';

describe('POST /api/v1/auth/register', () => {
  it('should register a new organization and user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        orgName: 'New Test Org',
        userName: 'Test Admin',
        email: 'admin@newtestorg.com',
        password: 'securePassword123',
      });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('admin@newtestorg.com');
    expect(res.body.role).toBe('ADMIN');
    expect(res.body.passwordHash).toBeUndefined(); // Should not leak hash
    
    // Check if the cookie was set
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=.+; HttpOnly/);
    
    // Check database state
    const dbUser = await prisma.user.findUnique({ where: { email: 'admin@newtestorg.com' } });
    expect(dbUser).not.toBeNull();
    
    const dbOrg = await prisma.organization.findUnique({ where: { id: dbUser.organizationId } });
    expect(dbOrg.name).toBe('New Test Org');
  });

  it('should reject registration if email already exists', async () => {
    // 1st request succeeds
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        orgName: 'Org A',
        userName: 'User A',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    // 2nd request fails
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        orgName: 'Org B',
        userName: 'User B',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/email already in use/i);
  });

  it('should reject a weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        orgName: 'Org C',
        userName: 'User C',
        email: 'weak@example.com',
        password: 'weak', // Less than 8 chars
      });

    expect(res.status).toBe(422); // Unprocessable Entity (Zod validation)
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields.password).toBeDefined();
  });

  it('should handle slug collisions gracefully by generating a new slug', async () => {
    // Both try to register with the exact same Org Name
    await request(app).post('/api/v1/auth/register').send({
      orgName: 'Acme Corp',
      userName: 'User 1',
      email: 'user1@acmecorp.com',
      password: 'password123',
    });

    const res2 = await request(app).post('/api/v1/auth/register').send({
      orgName: 'Acme Corp',
      userName: 'User 2',
      email: 'user2@acmecorp.com',
      password: 'password123',
    });

    expect(res2.status).toBe(201); // Succeeds because it appends random numbers to the slug

    // Verify they are actually two distinct orgs
    const dbUser1 = await prisma.user.findUnique({ where: { email: 'user1@acmecorp.com' }});
    const dbUser2 = await prisma.user.findUnique({ where: { email: 'user2@acmecorp.com' }});
    expect(dbUser1.organizationId).not.toBe(dbUser2.organizationId);
  });
});
