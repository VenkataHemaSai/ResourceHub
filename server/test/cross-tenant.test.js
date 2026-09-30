import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';

describe('Cross-Tenant Isolation Suite', () => {
  let orgA, orgB;
  let adminA, adminB, memberB;
  let resourceA, resourceB;
  let tokenA; // Admin A token

  beforeEach(async () => {
    const randomVal = Math.random().toString(36).substring(7);
    
    // 1. Create an admin for Org A and get a token
    const resA = await request(app)
      .post('/api/v1/auth/register')
      .send({
        orgName: `Tenant A Setup ${randomVal}`,
        userName: 'Admin A',
        email: `adminA${randomVal}@tenant.com`,
        password: 'password123',
      });
    
    // Extract cookie
    tokenA = resA.headers['set-cookie'][0];
    adminA = resA.body;
    orgA = { id: adminA.organizationId };

    // 2. Create users for Org B
    const bSetup = await request(app)
      .post('/api/v1/auth/register')
      .send({
        orgName: `Tenant B Setup ${randomVal}`,
        userName: 'Admin B',
        email: `adminB${randomVal}@tenant.com`,
        password: 'password123',
      });
    adminB = bSetup.body;
    orgB = { id: adminB.organizationId };
    
    memberB = await prisma.user.create({
      data: {
        name: 'Member B',
        email: `memberB${randomVal}@tenant.com`,
        passwordHash: 'fake',
        role: 'MEMBER',
        organizationId: orgB.id
      }
    });

    // 3. Create resources in both orgs
    resourceA = await prisma.resource.create({
      data: {
        name: 'Room A1',
        type: 'ROOM',
        organizationId: adminA.organizationId,
      }
    });

    resourceB = await prisma.resource.create({
      data: {
        name: 'Room B1',
        type: 'ROOM',
        organizationId: adminB.organizationId,
      }
    });
  });

  describe('Resource Isolation', () => {
    it('should list only Org A resources, completely hiding Org B', async () => {
      const res = await request(app)
        .get('/api/v1/resources')
        .set('Cookie', tokenA);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(resourceA.id);
      expect(res.body.data.some(r => r.id === resourceB.id)).toBe(false);
    });

    it('should return 404 when trying to view Org B resource directly', async () => {
      const res = await request(app)
        .get(`/api/v1/resources/${resourceB.id}`)
        .set('Cookie', tokenA);
      
      expect(res.status).toBe(404);
    });

    it('should return 404 when trying to patch Org B resource', async () => {
      const res = await request(app)
        .patch(`/api/v1/resources/${resourceB.id}`)
        .set('Cookie', tokenA)
        .send({ name: 'Hacked Room' });
      
      expect(res.status).toBe(404);
    });

    it('should return 404 when trying to deactivate Org B resource', async () => {
      const res = await request(app)
        .post(`/api/v1/resources/${resourceB.id}/deactivate`)
        .set('Cookie', tokenA);
      
      expect(res.status).toBe(404);
    });
  });

  describe('User Isolation', () => {
    it('should return 404 when trying to get or modify users from Org B (if single user endpoints exist)', async () => {
      // The current system only has list, but if we try to view a user, they should be hidden.
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', tokenA);
      
      expect(res.status).toBe(200);
      expect(res.body.data.some(u => u.id === adminB.id)).toBe(false);
      expect(res.body.data.some(u => u.id === memberB.id)).toBe(false);
    });
  });
});
