
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to DB...');
        const userCount = await prisma.user.count();
        console.log(`Successfully connected. User count: ${userCount}`);

        // Try to fetch one user
        const user = await prisma.user.findFirst();
        console.log('User found:', user ? user.email : 'None');

        await prisma.$disconnect();
    } catch (e) {
        console.error('DB Connection Failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();
