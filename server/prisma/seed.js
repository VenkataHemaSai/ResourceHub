import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma.js';

async function main() {
  const passwordHash = await bcrypt.hash('hemasai09', 10);

  console.log('Seeding database...');

  // Organization 1: Tech Innovators
  const org1 = await prisma.organization.upsert({
    where: { slug: 'tech-innovators' },
    update: {},
    create: {
      name: 'Tech Innovators',
      slug: 'tech-innovators',
      timezone: 'America/Los_Angeles',
    },
  });

  // Users for Org 1
  await prisma.user.upsert({
    where: { email: 'admin@techinnovators.com' },
    update: {},
    create: {
      organizationId: org1.id,
      name: 'Alice Admin',
      email: 'admin@techinnovators.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'member@techinnovators.com' },
    update: {},
    create: {
      organizationId: org1.id,
      name: 'Bob Member',
      email: 'member@techinnovators.com',
      passwordHash,
      role: 'MEMBER',
    },
  });

  // Resources for Org 1
  const org1Resources = [
    { name: 'Nvidia A100 GPU', type: 'Compute', description: 'High-performance computing node' },
    { name: 'Conference Room A', type: 'Room', description: 'Seats 10, contains projector' },
    { name: '3D Printer (Resin)', type: 'Equipment', description: 'Formlabs Form 3' }
  ];

  for (const res of org1Resources) {
    await prisma.resource.upsert({
      where: { organizationId_name: { organizationId: org1.id, name: res.name } },
      update: {},
      create: {
        organizationId: org1.id,
        ...res
      }
    });
  }

  // Organization 2: Local Library
  const org2 = await prisma.organization.upsert({
    where: { slug: 'local-library' },
    update: {},
    create: {
      name: 'Local Library',
      slug: 'local-library',
      timezone: 'America/New_York',
    },
  });

  // Users for Org 2
  await prisma.user.upsert({
    where: { email: 'admin@locallibrary.com' },
    update: {},
    create: {
      organizationId: org2.id,
      name: 'Carol Admin',
      email: 'admin@locallibrary.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'member@locallibrary.com' },
    update: {},
    create: {
      organizationId: org2.id,
      name: 'Dave Member',
      email: 'member@locallibrary.com',
      passwordHash,
      role: 'MEMBER',
    },
  });

  // Resources for Org 2
  const org2Resources = [
    { name: 'Study Room 1', type: 'Room', description: 'Quiet study room for 2' },
    { name: 'Public Computer 04', type: 'Computer', description: 'Windows 11 with MS Office' },
    { name: 'Microfilm Reader', type: 'Equipment', description: 'Archive room reader' }
  ];

  for (const res of org2Resources) {
    await prisma.resource.upsert({
      where: { organizationId_name: { organizationId: org2.id, name: res.name } },
      update: {},
      create: {
        organizationId: org2.id,
        ...res
      }
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Only disconnect if not running in an environment that maintains a pool across calls
    await prisma.$disconnect();
  });
