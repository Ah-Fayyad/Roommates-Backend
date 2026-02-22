import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { deleteImagesByUrls } from '../utils/cloudinary';

const prisma = new PrismaClient();

export const createListing = async (req: AuthRequest, res: Response) => {
    try {
        // Double-check user role (defense in depth)
        if (req.user.role !== 'LANDLORD') {
            return res.status(403).json({
                message: 'Only landlords can create listings. Please upgrade your account to post rooms.'
            });
        }

        const { title, description, price, address, latitude, longitude, amenities, images, roomType, size } = req.body;

        const listing = await prisma.listing.create({
            data: {
                ownerId: req.user.id,
                title,
                description,
                price: Number(price),
                address,
                latitude: Number(latitude),
                longitude: Number(longitude),
                amenities: Array.isArray(amenities) ? JSON.stringify(amenities) : amenities,
                roomType: roomType || 'private',
                size: Number(size) || 0,
                images: {
                    create: images.map((url: string) => ({ url })),
                },
            },
        });

        res.status(201).json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getListings = async (req: Request, res: Response) => {
    try {
        const { university, minPrice, maxPrice, type, area, amenities } = req.query;

        const where: any = { status: 'ACTIVE' };

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        if (area) {
            where.address = { contains: String(area) };
        }

        if (type && type !== 'all') {
            where.roomType = type;
        }

        if (amenities) {
            // Basic amenity check (if stored as JSON string in DB)
            // Or if using a separate table, then use 'some'
            // For now, simple text contains if it's JSON stringified
            where.amenities = { contains: String(amenities).replace(/[\[\]"]/g, '') };
        }

        const listings = await prisma.listing.findMany({
            where,
            include: { images: true, owner: { select: { fullName: true, avatar: true, university: true } } },
            orderBy: { createdAt: 'desc' }
        });

        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const getListingById = async (req: Request, res: Response) => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: req.params.id },
            include: { images: true, owner: true },
        });
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
    try {
        const listing = await prisma.listing.findUnique({ where: { id: req.params.id } });
        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        if (listing.ownerId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        const updated = await prisma.listing.update({
            where: { id: req.params.id },
            data: req.body,
        });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
    try {
        const listing = await prisma.listing.findUnique({
            where: { id: req.params.id },
            include: { images: true }
        });

        if (!listing) return res.status(404).json({ message: 'Listing not found' });
        if (listing.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Delete images from Cloudinary
        const imageUrls = listing.images.map(img => img.url);
        if (imageUrls.length > 0) {
            await deleteImagesByUrls(imageUrls);
        }

        // Use a transaction to delete all related records and the listing
        await prisma.$transaction([
            prisma.favorite.deleteMany({ where: { listingId: listing.id } }),
            prisma.visitRequest.deleteMany({ where: { listingId: listing.id } }),
            prisma.listingView.deleteMany({ where: { listingId: listing.id } }),
            prisma.report.deleteMany({ where: { reportedListingId: listing.id } }),
            prisma.listing.delete({ where: { id: listing.id } })
        ]);

        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        console.error("Delete Listing Error:", error);
        res.status(500).json({ message: 'Server error', error: String(error) });
    }
};
export const getUserListings = async (req: AuthRequest, res: Response) => {
    try {
        const listings = await prisma.listing.findMany({
            where: { ownerId: req.user.id },
            include: { images: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
