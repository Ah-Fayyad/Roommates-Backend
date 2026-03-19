
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const listings = await prisma.listing.findMany({
        take: 5,
        include: { images: true }
    });
    console.log(JSON.stringify(listings, null, 2));
    await prisma.$disconnect();
}

check();
