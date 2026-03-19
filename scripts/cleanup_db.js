
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const listings = await prisma.listing.findMany({
        include: {
            images: true,
            owner: true
        }
    });

    console.log(`Total listings: ${listings.length}`);

    const broken = listings.filter(l => 
        !l.title || 
        !l.description || 
        !l.owner || 
        l.images.length === 0 || 
        !l.images[0].url
    );

    console.log(`Broken listings: ${broken.length}`);
    broken.forEach(l => {
        console.log(`ID: ${l.id} | Title: ${l.title} | Images: ${l.images.length} | First Image: ${l.images[0]?.url || 'NONE'}`);
    });

    if (broken.length > 0) {
        console.log('Cleaning up broken listings...');
        const ids = broken.map(l => l.id);
        
        // Delete related data first
        await prisma.image.deleteMany({ where: { listingId: { in: ids } } });
        await prisma.favorite.deleteMany({ where: { listingId: { in: ids } } });
        await prisma.visitRequest.deleteMany({ where: { listingId: { in: ids } } });
        await prisma.listingView.deleteMany({ where: { listingId: { in: ids } } });
        await prisma.report.deleteMany({ where: { reportedListingId: { in: ids } } });
        
        const deleted = await prisma.listing.deleteMany({
            where: {
                id: { in: ids }
            }
        });
        console.log(`Deleted ${deleted.count} broken listings.`);
    }

    await prisma.$disconnect();
}

check();
