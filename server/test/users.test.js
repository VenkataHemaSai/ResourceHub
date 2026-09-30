import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/utils/prisma.js';
import { hashPassword, generateToken } from '../src/utils/auth.js';

describe('User Management Endpoints', () => {
  let adminTokenOrgA;
  let memberTokenOrgA;
  let adminTokenOrgB;
  let orgAId;
  let orgBId;

  beforeEach(async () => {
    // Set up Org A
    const orgA = await prisma.organization.create({
      data: { name: 'Org A', slug: 'org-a' }
    });
    orgAId = orgA.id;
    
    const adminA = await prisma.user.create({
      data: {
        organizationId: orgA.id,
        name: 'Admin A',
        email: 'admin.a@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN'
      }
    });
    adminTokenOrgA = generateToken({ userId: adminA.id, organizationId: orgA.id, role: 'ADMIN' });

    const memberA = await prisma.user.create({
      data: {
        organizationId: orgA.id,
        name: 'Member A',
        email: 'member.a@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'MEMBER'
      }
    });
    memberTokenOrgA = generateToken({ userId: memberA.id, organizationId: orgA.id, role: 'MEMBER' });

    // Set up Org B
    const orgB = await prisma.organization.create({
      data: { name: 'Org B', slug: 'org-b' }
    });
    orgBId = orgB.id;

    const adminB = await prisma.user.create({
      data: {
        organizationId: orgB.id,
        name: 'Admin B',
        email: 'admin.b@example.com',
        passwordHash: await hashPassword('password123'),
        role: 'ADMIN'
      }
    });
    adminTokenOrgB = generateToken({ userId: adminB.id, organizationId: orgB.id, role: 'ADMIN' });
  });

  describe('Role Enforcement', () => {
    it('should reject a MEMBER from creating a user with 403', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', [`token=${memberTokenOrgA}`])
        .send({
          name: 'New Guy',
          email: 'new@example.com',
          password: 'password123',
        });
      
      expect(res.status).toBe(403);
    });

    it('should reject a MEMBER from listing users with 403', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', [`token=${memberTokenOrgA}`]);
      
      expect(res.status).toBe(403);
    });
  });

  describe('User Creation Isolation', () => {
    it('should allow ADMIN to create a MEMBER in their own org', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Cookie', [`token=${adminTokenOrgA}`])
        .send({
          name: 'New Guy A',
          email: 'new.a@example.com',
          password: 'password123',
          // Maliciously trying to create in another org or as an admin
          organizationId: orgBId,
          role: 'ADMIN',
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe('new.a@example.com');
      
      // Verify the user was created in Org A as a MEMBER despite malicious payload
      const dbUser = await prisma.user.findUnique({ where: { email: 'new.a@example.com' } });
      expect(dbUser.organizationId).toBe(orgAId);
      expect(dbUser.role).toBe('MEMBER');
    });
  });

  describe('List Users Isolation', () => {
    it('should allow ADMIN to list users in their org', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Cookie', [`token=${adminTokenOrgA}`]);
        
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // Admin A + Member A
      expect(res.body.meta.total).toBe(2);
      
      // Ensure no Org B users leaked
      const hasOrgBUsers = res.body.data.some(u => u.organizationId === orgBId);
      expect(hasOrgBUsers).toBe(false);
    });
  });
});
