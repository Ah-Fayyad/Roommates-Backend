const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function reset() {
  console.log('Resetting Admin and Landlord passwords...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Update or create Landlord
  await prisma.user.upsert({
    where: { email: 'ahmed@example.com' },
    update: { password: hashedPassword, role: 'LANDLORD' },
    create: {
      email: 'ahmed@example.com',
      password: hashedPassword,
      fullName: 'Ahmed Khaled (Landlord)',
      role: 'LANDLORD',
      isVerified: true
    }
  });

  // Update or create Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'ADMIN',
      isVerified: true
    }
  });

  console.log('✅ Done!');
  console.log('Email: ahmed@example.com or admin@example.com');
  console.log('Password: password123');
}

reset()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
