import cloudinary from '../config/cloudinary';

/**
 * Extracts the public ID from a Cloudinary URL.
 * @param url The full Cloudinary URL
 * @returns The public ID or null if not found
 */
export const getPublicIdFromUrl = (url: string): string | null => {
    try {
        // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/roommates-platform/avatar.jpg
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

/**
 * Deletes an image from Cloudinary.
 * @param publicId The public ID of the image to delete
 */
export const deleteImage = async (publicId: string): Promise<void> => {
    try {
        if (!publicId) return;
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error(`Failed to delete image ${publicId}:`, error);
    }
};

/**
 * Deletes multiple images from Cloudinary.
 * @param urls Array of image URLs to delete
 */
export const deleteImagesByUrls = async (urls: string[]): Promise<void> => {
    const deletePromises = urls.map(url => {
        const publicId = getPublicIdFromUrl(url);
        return publicId ? deleteImage(publicId) : Promise.resolve();
    });
    await Promise.all(deletePromises);
};
