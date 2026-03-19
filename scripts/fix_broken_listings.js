
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
    const listings = await prisma.listing.findMany({
        include: { images: true }
    });

    console.log(`Checking ${listings.length} listings...`);

    const toDelete = [];

    for (const listing of listings) {
        // If no images
        if (listing.images.length === 0) {
            console.log(`Listing ${listing.id} has NO images.`);
            toDelete.push(listing.id);
            continue;
        }

        // Check if any image URL is invalid (empty, whitespace, or placeholder-like)
        const hasInvalidImage = listing.images.some(img => !img.url || img.url.trim() === "" || img.url.includes("via.placeholder.com"));
        
        if (hasInvalidImage) {
            console.log(`Listing ${listing.id} has invalid image URLs.`);
            toDelete.push(listing.id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} listings...`);
        // Delete in order to avoid FK constraints if necessary, though onDelete: Cascade should handle it
        await prisma.image.deleteMany({ where: { listingId: { in: toDelete } } });
        await prisma.favorite.deleteMany({ where: { listingId: { in: toDelete } } });
        await prisma.visitRequest.deleteMany({ where: { listingId: { in: toDelete } } });
        await prisma.listingView.deleteMany({ where: { listingId: { in: toDelete } } });
        await prisma.report.deleteMany({ where: { reportedListingId: { in: toDelete } } });

        const result = await prisma.listing.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Deleted ${result.count} listings.`);
    } else {
        console.log("No broken listings found.");
    }

    await prisma.$disconnect();
}

cleanup().catch(console.error);
