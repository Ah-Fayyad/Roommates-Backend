
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const listing = await prisma.listing.findUnique({
        where: { id: "736b5d7a-3f4d-4178-b65a-56aca1f4e182" },
        include: { images: true }
    });

    console.log(JSON.stringify(listing, null, 2));
    await prisma.$disconnect();
}

check();
