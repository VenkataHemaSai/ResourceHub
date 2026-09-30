import { describe, it, expect, beforeAll } from 'vitest';
import supertest from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';
import { hashPassword } from '../src/utils/auth.js';

const request = supertest(app);

async function seedOrg(orgName, userEmail, userPassword = 'password123') {
  const org = await prisma.organization.create({
    data: { name: orgName, slug: orgName.toLowerCase().replace(/\s+/g, '-') },
  });

  const user = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: 'Test User',
      email: userEmail,
      passwordHash: await hashPassword(userPassword),
      role: 'ADMIN',
    },
  });

  const resource = await prisma.resource.create({
    data: {
      organizationId: org.id,
      name: 'Room A',
      type: 'meeting_room',
      isActive: true,
    },
  });

  return { org, user, resource };
}

async function loginAs(email, password = 'password123') {
  const res = await request.post('/api/v1/auth/login').send({ email, password });
  const cookie = res.headers['set-cookie'];
  return cookie;
}

describe('POST /api/v1/reservations', () => {
  it('creates a reservation successfully (201)', async () => {
    const { user, resource } = await seedOrg('Org Alpha', 'alpha@example.com');
    const cookie = await loginAs('alpha@example.com');

    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();

    const res = await request
      .post('/api/v1/reservations')
      .set('Cookie', cookie)
      .send({ resourceId: resource.id, startTime: start, endTime: end });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      resourceId: resource.id,
      userId: user.id,
      status: 'CONFIRMED',
    });
  });

  it('blocks overlapping reservation (409)', async () => {
    const { resource } = await seedOrg('Org Beta', 'beta@example.com');
    const cookie = await loginAs('beta@example.com');

    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();

    await request
      .post('/api/v1/reservations')
      .set('Cookie', cookie)
      .send({ resourceId: resource.id, startTime: start, endTime: end });

    const res = await request
      .post('/api/v1/reservations')
      .set('Cookie', cookie)
      .send({ resourceId: resource.id, startTime: start, endTime: end });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/reservations/:id/cancel', () => {
  it('owner can cancel their own reservation (200)', async () => {
    const { resource } = await seedOrg('Org Gamma', 'gamma@example.com');
    const cookie = await loginAs('gamma@example.com');

    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();

    const created = await request
      .post('/api/v1/reservations')
      .set('Cookie', cookie)
      .send({ resourceId: resource.id, startTime: start, endTime: end });

    const res = await request
      .post(`/api/v1/reservations/${created.body.id}/cancel`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('non-admin member cannot cancel another user reservation (403)', async () => {
    const { org, resource } = await seedOrg('Org Delta', 'delta-admin@example.com');

    const member = await prisma.user.create({
      data: {
        organizationId: org.id,
        name: 'Member User',
        email: 'delta-member@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'MEMBER',
      },
    });

    const adminCookie = await loginAs('delta-admin@example.com');
    const memberCookie = await loginAs('delta-member@example.com');

    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();

    const created = await request
      .post('/api/v1/reservations')
      .set('Cookie', adminCookie)
      .send({ resourceId: resource.id, startTime: start, endTime: end });

    const res = await request
      .post(`/api/v1/reservations/${created.body.id}/cancel`)
      .set('Cookie', memberCookie);

    expect(res.status).toBe(403);
  });
});

describe('Cross-tenant isolation', () => {
  it('org B cannot see or cancel org A reservation (404)', async () => {
    const { resource: resA } = await seedOrg('Org Epsilon', 'epsilon@example.com');
    await seedOrg('Org Zeta', 'zeta@example.com');

    const cookieA = await loginAs('epsilon@example.com');
    const cookieB = await loginAs('zeta@example.com');

    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 7200_000).toISOString();

    const created = await request
      .post('/api/v1/reservations')
      .set('Cookie', cookieA)
      .send({ resourceId: resA.id, startTime: start, endTime: end });

    expect(created.status).toBe(201);

    const res = await request
      .post(`/api/v1/reservations/${created.body.id}/cancel`)
      .set('Cookie', cookieB);

    expect(res.status).toBe(404);
  });
});
