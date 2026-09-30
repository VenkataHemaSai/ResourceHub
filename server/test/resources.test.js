import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';

describe('Resources API', () => {
  let admin, member, organization;
  let adminToken, memberToken;
  let activeResource, inactiveResource;

  beforeEach(async () => {
    const randomVal = Math.random().toString(36).substring(7);

    // Setup Admin
    const resA = await request(app).post('/api/v1/auth/register').send({
      orgName: `Res Org Setup ${randomVal}`,
      userName: 'Admin A',
      email: `res_admin${randomVal}@test.com`,
      password: 'password123',
    });
    adminToken = resA.headers['set-cookie'][0];
    admin = resA.body;
    organization = { id: admin.organizationId };

    // Member Login to get a valid token with the MEMBER role
    const bSetup = await request(app).post('/api/v1/auth/register').send({
      orgName: `Res Org 2 ${randomVal}`,
      userName: 'Admin B',
      email: `res_admin2${randomVal}@test.com`,
      password: 'password123'
    });
    
    // Create member properly via Admin A's token
    await request(app).post('/api/v1/users').set('Cookie', adminToken).send({
      name: 'Member',
      email: `res_member${randomVal}@test.com`,
      password: 'password123'
    });
    
    // Login as member
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: `res_member${randomVal}@test.com`,
      password: 'password123'
    });
    memberToken = loginRes.headers['set-cookie'][0];

    // Create Resources
    activeResource = await prisma.resource.create({
      data: { name: 'Active Room', type: 'ROOM', organizationId: organization.id, isActive: true }
    });
    inactiveResource = await prisma.resource.create({
      data: { name: 'Broken Projector', type: 'EQUIPMENT', organizationId: organization.id, isActive: false }
    });
  });

  describe('GET /api/v1/resources', () => {
    it('should let admin see all resources', async () => {
      const res = await request(app).get('/api/v1/resources').set('Cookie', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.some(r => r.id === activeResource.id)).toBe(true);
      expect(res.body.data.some(r => r.id === inactiveResource.id)).toBe(true);
    });

    it('should let member see only active resources', async () => {
      const res = await request(app).get('/api/v1/resources').set('Cookie', memberToken);
      expect(res.status).toBe(200);
      expect(res.body.data.some(r => r.id === activeResource.id)).toBe(true);
      expect(res.body.data.some(r => r.id === inactiveResource.id)).toBe(false);
    });
  });

  describe('GET /api/v1/resources/:id', () => {
    it('should let member view active resource', async () => {
      const res = await request(app).get(`/api/v1/resources/${activeResource.id}`).set('Cookie', memberToken);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(activeResource.id);
    });

    it('should return 404 when member tries to view inactive resource', async () => {
      const res = await request(app).get(`/api/v1/resources/${inactiveResource.id}`).set('Cookie', memberToken);
      expect(res.status).toBe(404);
    });
  });

  describe('Write APIs (Admin Only)', () => {
    it('should return 403 when member tries to create a resource', async () => {
      const res = await request(app).post('/api/v1/resources').set('Cookie', memberToken).send({
        name: 'Hacked Room', type: 'ROOM'
      });
      expect(res.status).toBe(403);
    });

    it('should allow admin to create a resource', async () => {
      const res = await request(app).post('/api/v1/resources').set('Cookie', adminToken).send({
        name: 'New Room', type: 'ROOM'
      });
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Room');
      expect(res.body.organizationId).toBe(organization.id);
    });

    it('should reject duplicate name in same org', async () => {
      const res = await request(app).post('/api/v1/resources').set('Cookie', adminToken).send({
        name: 'Active Room', type: 'ROOM'
      });
      expect(res.status).toBe(409);
    });

    it('should allow admin to deactivate resource', async () => {
      const res = await request(app).post(`/api/v1/resources/${activeResource.id}/deactivate`).set('Cookie', adminToken);
      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });
  });
});
