
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@roommates.com' }
    });
    console.log('Admin found:', admin ? 'YES' : 'NO');
    if (admin) console.log('Admin Role:', admin.role);

    const landlord = await prisma.user.findUnique({
        where: { email: 'landlord0@example.com' }
    });
    console.log('Landlord found:', landlord ? 'YES' : 'NO');
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
