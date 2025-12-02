import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { deleteImagesByUrls } from '../utils/cloudinary';

const prisma = new PrismaClient();

export const createListing = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, price, address, latitude, longitude, amenities, images } = req.body;

        const listing = await prisma.listing.create({
            data: {
                ownerId: req.user.id,
                title,
                description,
                price,
                address,
                latitude,
                longitude,
                amenities,
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
        const { university, minPrice, maxPrice } = req.query;

        const where: any = { status: 'ACTIVE' };

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = Number(minPrice);
            if (maxPrice) where.price.lte = Number(maxPrice);
        }

        // Note: University filter would typically be on the User (owner) or if Listing had a university field.
        // Assuming filtering by owner's university for now if needed, or just simple filters.

        const listings = await prisma.listing.findMany({
            where,
            include: { images: true, owner: { select: { fullName: true, avatar: true, university: true } } },
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
        if (listing.ownerId !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

        // Delete images from Cloudinary
        const imageUrls = listing.images.map(img => img.url);
        if (imageUrls.length > 0) {
            await deleteImagesByUrls(imageUrls);
        }

        await prisma.listing.delete({ where: { id: req.params.id } });
        res.json({ message: 'Listing deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
