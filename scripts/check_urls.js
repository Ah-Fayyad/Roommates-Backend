
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const images = await prisma.image.findMany({
        take: 100,
        select: { url: true, listingId: true }
    });

    for (const img of images) {
        if (!img.url.startsWith("http")) {
            console.log(`Listing ${img.listingId} has local or malformed URL: ${img.url}`);
        }
    }
    
    await prisma.$disconnect();
}

check().catch(console.error);
