
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        const hashedPassword = await bcrypt.hash('test123456', 10);
        const admin = await prisma.user.upsert({
            where: { email: 'admin@test.com' },
            update: { role: 'ADMIN', password: hashedPassword },
            create: {
                email: 'admin@test.com',
                password: hashedPassword,
                fullName: 'System Admin',
                role: 'ADMIN',
                isVerified: true,
            },
        });
        console.log('Admin user created/updated:', admin);
    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
