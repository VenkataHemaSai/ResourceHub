import prisma from '../src/utils/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

  const org = await prisma.organization.upsert({
    where: { slug: 'iiit-sri-city' },
    update: {},
    create: {
      name: 'IIIT Sri City',
      slug: 'iiit-sri-city',
      timezone: 'Asia/Kolkata',
    },
  });

  const password = await bcrypt.hash('hemasai09', 10);

  const users = [
    { email: 'venkatahemasai.b23@iiits.in', name: 'Venkata Hema Sai', role: 'ADMIN' },
    { email: 'arjun.b23@iiits.in', name: 'Arjun Reddy', role: 'MEMBER' },
    { email: 'priya.b23@iiits.in', name: 'Priya Sharma', role: 'MEMBER' },
    { email: 'kiran.b23@iiits.in', name: 'Kiran Kumar', role: 'MEMBER' },
    { email: 'neha.b23@iiits.in', name: 'Neha Patel', role: 'MEMBER' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: password, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: password,
        role: u.role,
        organizationId: org.id,
      },
    });
    createdUsers.push(user);
  }

  const resources = [
    {
      name: 'GPU Server — Node 1',
      type: 'GPU',
      description: 'NVIDIA A100 80GB. Available for deep learning and compute-intensive tasks.',
      quantity: 3,
      minDurationMinutes: 30,
      maxDurationMinutes: 480,
      openTime: '08:00',
      closeTime: '20:00',
    },
    {
      name: 'DSLR Camera Kit',
      type: 'Camera',
      description: 'Canon EOS R6 with 24-105mm lens, tripod, and SD cards included.',
      quantity: 2,
      minDurationMinutes: 60,
      maxDurationMinutes: 360,
      openTime: '09:00',
      closeTime: '18:00',
    },
    {
      name: 'MacBook Pro 16"',
      type: 'Laptop',
      description: 'M3 Max, 64 GB RAM, 1 TB SSD. For presentations and development.',
      quantity: 4,
      minDurationMinutes: 30,
      maxDurationMinutes: 480,
      openTime: '08:00',
      closeTime: '20:00',
    },
    {
      name: 'Seminar Hall A',
      type: 'Room',
      description: 'Capacity 120. Full A/V setup, projector, and air conditioning.',
      quantity: 1,
      minDurationMinutes: 60,
      maxDurationMinutes: 240,
      openTime: '09:00',
      closeTime: '18:00',
    },
    {
      name: 'VR Headset',
      type: 'VR',
      description: 'Meta Quest 3. Includes controllers and charging dock.',
      quantity: 2,
      minDurationMinutes: 30,
      maxDurationMinutes: 120,
      openTime: '10:00',
      closeTime: '17:00',
    },
  ];

  const createdResources = [];
  for (const res of resources) {
    const resource = await prisma.resource.upsert({
      where: { organizationId_name: { organizationId: org.id, name: res.name } },
      update: {},
      create: { ...res, organizationId: org.id },
    });
    createdResources.push(resource);
  }

  await prisma.reservation.deleteMany({
    where: { notes: { startsWith: 'Seeded:' } },
  });

  const base = new Date();
  base.setMinutes(0, 0, 0);

  const tomorrow = new Date(base);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const seedReservations = [
    {
      resourceId: createdResources[0].id,
      userId: createdUsers[1].id,
      startTime: new Date(tomorrow),
      endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      status: 'PENDING_ALLOCATION',
      notes: 'Seeded: Training run for final year project',
    },
    {
      resourceId: createdResources[1].id,
      userId: createdUsers[2].id,
      startTime: new Date(tomorrow.getTime() + 1 * 60 * 60 * 1000),
      endTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      status: 'PENDING_ALLOCATION',
      notes: 'Seeded: Photoshoot for fest poster',
    },
    {
      resourceId: createdResources[2].id,
      userId: createdUsers[3].id,
      startTime: new Date(base.getTime() - 3 * 60 * 60 * 1000),
      endTime: new Date(base.getTime() - 1 * 60 * 60 * 1000),
      status: 'RETURNED',
      notes: 'Seeded: Internship presentation prep',
      actualEndTime: new Date(base.getTime() - 55 * 60 * 1000),
    },
  ];

  for (const r of seedReservations) {
    try {
      await prisma.reservation.create({ data: { ...r, organizationId: org.id } });
    } catch {
      console.log(`Skipped duplicate seed reservation`);
    }
  }

  console.log('\nSeed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Organization : IIIT Sri City');
  console.log('Admin        : venkatahemasai.b23@iiits.in / hemasai09');
  console.log('Members      : arjun / priya / kiran / neha @iiits.in / hemasai09');
  console.log('Resources    : 5 seeded (no images — upload via Admin UI)');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
