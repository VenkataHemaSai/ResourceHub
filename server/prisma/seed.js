import prisma from '../src/lib/prisma.js';
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

  // 2. Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acme.com' },
    update: {
      passwordHash: adminPassword,
    },
    create: {
      email: 'admin@acme.com',
      name: 'Admin User',
      passwordHash: adminPassword,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  // 3. Create Resources
  const resources = [
    { name: 'Conference Room A', type: 'ROOM', description: 'Large room with a projector and whiteboard.', isActive: true },
    { name: 'Conference Room B', type: 'ROOM', description: 'Small room for 1-on-1 meetings.', isActive: true },
    { name: 'MacBook Pro 16"', type: 'EQUIPMENT', description: 'M3 Max, 64GB RAM.', isActive: true },
    { name: 'Company Tesla', type: 'VEHICLE', description: 'Model 3 Long Range.', isActive: true },
    { name: 'Broken Projector', type: 'EQUIPMENT', description: 'Awaiting repairs.', isActive: false },
  ];

  for (const res of resources) {
    await prisma.resource.upsert({
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
  }

  console.log('Seed completed successfully!');
  console.log('--------------------------------------------------');
  console.log('Test Account created:');
  console.log('Email:    admin@acme.com');
  console.log('Password: admin123');
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
