import prisma from '../src/utils/prisma.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
    },
  });

  // 2. Create Users (1 Admin, 3 Members)
  const defaultPassword = await bcrypt.hash('password123', 10);
  
  const users = [
    { email: 'admin@acme.com', name: 'Admin User', role: 'ADMIN' },
    { email: 'john@acme.com', name: 'John Doe', role: 'MEMBER' },
    { email: 'sarah@acme.com', name: 'Sarah Smith', role: 'MEMBER' },
    { email: 'mike@acme.com', name: 'Mike Johnson', role: 'MEMBER' },
  ];

  const createdUsers = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: defaultPassword, role: u.role },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: defaultPassword,
        role: u.role,
        organizationId: org.id,
      },
    });
    createdUsers.push(user);
  }

  // 3. Create Resources
  const resources = [
    { name: 'Conference Room A', type: 'ROOM', description: 'Large room with a projector and whiteboard.', isActive: true },
    { name: 'Conference Room B', type: 'ROOM', description: 'Small room for 1-on-1 meetings.', isActive: true },
    { name: 'MacBook Pro 16"', type: 'EQUIPMENT', description: 'M3 Max, 64GB RAM.', isActive: true },
    { name: 'Company Tesla', type: 'VEHICLE', description: 'Model 3 Long Range.', isActive: true },
    { name: 'Broken Projector', type: 'EQUIPMENT', description: 'Awaiting repairs.', isActive: false },
  ];

  const createdResources = [];
  for (const res of resources) {
    const resource = await prisma.resource.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: res.name,
        },
      },
      update: {},
      create: {
        ...res,
        organizationId: org.id,
      },
    });
    createdResources.push(resource);
  }

  // 4. Create Fake Reservations for Calendar
  // Delete existing seeded reservations first to avoid overlap conflicts on re-runs
  await prisma.reservation.deleteMany({
    where: { notes: { startsWith: 'Seeded:' } }
  });

  const today = new Date();
  today.setHours(10, 0, 0, 0); // Start at 10 AM today

  const reservations = [
    {
      resourceId: createdResources[0].id, // Conf Room A
      userId: createdUsers[1].id, // John
      startTime: new Date(today), // 10:00 AM
      endTime: new Date(today.getTime() + 60 * 60 * 1000), // 11:00 AM
      notes: 'Seeded: Team Sync',
      status: 'CONFIRMED'
    },
    {
      resourceId: createdResources[0].id, // Conf Room A
      userId: createdUsers[2].id, // Sarah
      startTime: new Date(today.getTime() + 2 * 60 * 60 * 1000), // 12:00 PM
      endTime: new Date(today.getTime() + 3.5 * 60 * 60 * 1000), // 1:30 PM
      notes: 'Seeded: Client Pitch',
      status: 'CONFIRMED'
    },
    {
      resourceId: createdResources[1].id, // Conf Room B
      userId: createdUsers[3].id, // Mike
      startTime: new Date(today.getTime() - 24 * 60 * 60 * 1000), // Yesterday 10 AM
      endTime: new Date(today.getTime() - 23 * 60 * 60 * 1000), // Yesterday 11 AM
      notes: 'Seeded: 1-on-1',
      status: 'CONFIRMED'
    },
    {
      resourceId: createdResources[2].id, // MacBook
      userId: createdUsers[1].id, // John
      startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow 10 AM
      endTime: new Date(today.getTime() + 48 * 60 * 60 * 1000), // Day after tomorrow 10 AM
      notes: 'Seeded: Dev Conference Trip',
      status: 'CONFIRMED'
    }
  ];

  for (const r of reservations) {
    try {
      await prisma.reservation.create({
        data: {
          ...r,
          organizationId: org.id
        }
      });
    } catch (err) {
      console.log(`Skipped seeding reservation for resource ${r.resourceId} (possible overlap)`);
    }
  }

  console.log('Seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Test Accounts created:');
  console.log('1. Admin: admin@acme.com / password123');
  console.log('2. Member: john@acme.com / password123');
  console.log('3. Member: sarah@acme.com / password123');
  console.log('4. Member: mike@acme.com / password123');
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
