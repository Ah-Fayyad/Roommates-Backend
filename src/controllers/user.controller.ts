import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { deleteImagesByUrls } from "../utils/cloudinary";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Get user profile
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      console.error("No userId in request:", req.user);
      return res.status(401).json({ message: "Unauthorized - no user ID" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        isVerified: true,
        phoneNumber: true,
        createdAt: true,
        university: true,
        bio: true,
        language: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error: any) {
    console.error("Get profile error:", error.message, error.code);
    res.status(500).json({
      message: "Server error",
      debug: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fullName, phone, university, bio, preferences, avatar } = req.body;

    const updateData: any = {
      fullName: fullName || undefined,
      avatar: avatar || undefined,
      phoneNumber: phone || undefined,
      university: university || undefined,
      bio: bio || undefined,
    };

    // Handle preferences if provided
    if (preferences) {
      updateData.preferences = {
        upsert: {
          create: {
            cleanliness: preferences.cleanliness || 5,
            studyHabits: preferences.studyHabits || 5,
            quietHours: preferences.quietHours || 5,
            socializing: preferences.socializing || 5,
            cooking: preferences.cooking || 5,
            smoking: preferences.smoking || false,
            guests: preferences.guests || true,
            pets: preferences.pets || false,
            sleepSchedule: preferences.sleepSchedule || "FLEXIBLE",
            workSchedule: preferences.workSchedule || "STUDENT",
            budget: preferences.budget || 500,
          },
          update: {
            cleanliness: preferences.cleanliness,
            studyHabits: preferences.studyHabits,
            quietHours: preferences.quietHours,
            socializing: preferences.socializing,
            cooking: preferences.cooking,
            smoking: preferences.smoking,
            guests: preferences.guests,
            pets: preferences.pets,
            sleepSchedule: preferences.sleepSchedule,
            workSchedule: preferences.workSchedule,
            budget: preferences.budget,
          },
        },
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        phoneNumber: true,
        university: true,
        bio: true,
        role: true,
        preferences: true,
      },
    });

    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user settings
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      email,
      currentPassword,
      newPassword,
      confirmPassword,
      phoneNumber,
      fullName,
      language,
    } = req.body;

    console.log("📝 Update settings request from userId:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("❌ User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    // If changing password, validate it
    if (currentPassword || newPassword) {
      console.log("🔐 Password change requested");

      // Check if both current and new passwords are provided
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to change password",
          error: "MISSING_CURRENT_PASSWORD",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          message: "New password cannot be empty",
          error: "MISSING_NEW_PASSWORD",
        });
      }

      // Check if passwords match
      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: "New passwords do not match",
          error: "PASSWORD_MISMATCH",
        });
      }

      // Check password length
      if (newPassword.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
          error: "PASSWORD_TOO_SHORT",
        });
      }

      // Verify current password
      if (!user.password) {
        return res.status(400).json({
          message: "Account was created via Google. Security update required.",
          error: "NO_PASSWORD_SET",
        });
      }

      const isValidPassword = await bcrypt.compare(
        currentPassword,
        user.password,
      );

      if (!isValidPassword) {
        console.log("❌ Incorrect current password");
        return res.status(400).json({
          message: "Current password is incorrect",
          error: "INVALID_PASSWORD",
        });
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      console.log("✅ Password updated successfully");
    }

    const updateData: any = {};

    // Update fullName if provided
    if (fullName && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }

    // Update email if changed
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        console.log("❌ Email already in use:", email);
        return res.status(400).json({
          message: "Email already in use",
          error: "DUPLICATE_EMAIL",
        });
      }
      updateData.email = email;
      console.log("📧 Email updated:", email);
    }

    // Update phoneNumber if provided
    if (phoneNumber && phoneNumber.trim()) {
      updateData.phoneNumber = phoneNumber.trim();
      console.log("📱 Phone number updated");
    }

    // Update language if valid
    if (language && ["en", "ar"].includes(language)) {
      updateData.language = language;
      console.log("🌐 Language updated:", language);
    }

    // Apply updates
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
      console.log("✅ User data updated successfully");
    }

    res.json({
      message: "Settings updated successfully",
      success: true,
    });
  } catch (error: any) {
    console.error("❌ Update settings error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete user account
export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    // 1. Collect all info and IDs related to user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listings: { select: { id: true, images: { select: { url: true } } } },
        verification: { select: { documentUrl: true } },
        chats: { select: { id: true } },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const listingIds = user.listings.map((l) => l.id);
    const chatIds = user.chats.map((c) => c.id);

    // 2. Delete images from Cloudinary (Async but no need to wait for result to proceed with DB)
    const imagesToDelete: string[] = [];
    if (user.avatar) imagesToDelete.push(user.avatar);
    if (user.verification?.documentUrl)
      imagesToDelete.push(user.verification.documentUrl);
    user.listings.forEach((l) =>
      l.images.forEach((img) => imagesToDelete.push(img.url)),
    );

    if (imagesToDelete.length > 0) {
      deleteImagesByUrls(imagesToDelete).catch((err) =>
        console.error("Cloudinary delete error:", err),
      );
    }

    // 3. Perform manual deep delete in the correct order to satisfy foreign keys
    // SQLite in Prisma doesn't always handle cascading well for complex relations
    await prisma.$transaction(async (tx) => {
      // Notifications (Simple)
      await tx.notification.deleteMany({ where: { userId } });

      // Favorites (Links user and listings)
      await tx.favorite.deleteMany({
        where: { OR: [{ userId }, { listingId: { in: listingIds } }] },
      });

      // Preferences (One-to-One)
      await tx.preference.deleteMany({ where: { userId } });

      // Verification Request (One-to-One)
      await tx.verificationRequest.deleteMany({ where: { userId } });

      // Visit Requests (Multiple relations)
      await tx.visitRequest.deleteMany({
        where: {
          OR: [
            { requesterId: userId },
            { ownerId: userId },
            { listingId: { in: listingIds } },
          ],
        },
      });

      // Listing Views
      await tx.listingView.deleteMany({
        where: {
          OR: [{ viewerId: userId }, { listingId: { in: listingIds } }],
        },
      });

      // Reports (Sent or Received)
      await tx.report.deleteMany({
        where: {
          OR: [
            { reporterId: userId },
            { reportedUserId: userId },
            { reportedListingId: { in: listingIds } },
          ],
        },
      });

      // Messages and Chats
      // First delete all messages sent by the user
      await tx.message.deleteMany({ where: { senderId: userId } });
      // Then delete messages in chats the user was part of (to avoid orphaned msgs)
      await tx.message.deleteMany({ where: { chatId: { in: chatIds } } });
      // Since User-Chat is implicit m-n, deleting user removes link but not the Chat itself
      // We'll leave the Chat object for now or cleanup if empty
      await tx.chat.deleteMany({ where: { id: { in: chatIds } } });

      // Images for user's listings
      await tx.image.deleteMany({ where: { listingId: { in: listingIds } } });

      // Listings
      await tx.listing.deleteMany({ where: { ownerId: userId } });

      // Admin Actions (Actions targeting this user or performed by this user)
      await tx.adminAction.deleteMany({
        where: { OR: [{ adminId: userId }, { targetId: userId }] },
      });

      // Finally: Delete the User record
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({
      message:
        "Everything related to your account has been permanently deleted.",
    });
  } catch (error) {
    console.error("CRITICAL: Hard delete failed:", error);
    res.status(500).json({
      message:
        "Failed to fully delete account. Please contact support to release your email.",
    });
  }
};

// Request verification
export const requestVerification = async (req: AuthRequest, res: Response) => {
  try {
    const { documentUrls } = req.body; // Expecting array of URLs [front, back]
    if (
      !documentUrls ||
      !Array.isArray(documentUrls) ||
      documentUrls.length === 0
    ) {
      return res.status(400).json({ message: "Document URLs are required" });
    }

    // Convert array to string or store as JSON if needed, but schema has documentUrl (singular)
    // Let's store them as a comma separated string or update schema if possible.
    // Given current schema, let's use the first one or join them.
    const docUrl = documentUrls.join(",");

    const request = await prisma.verificationRequest.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        documentUrl: docUrl,
        status: "PENDING",
      },
      update: {
        documentUrl: docUrl,
        status: "PENDING",
      },
    });

    res.json({
      message: "Verification request submitted successfully",
      request,
    });
  } catch (error) {
    console.error("Request verification error:", error);
    res.status(500).json({ message: "Server error submitting verification" });
  }
};

// Get user visits (sent and received)
export const getVisits = async (req: AuthRequest, res: Response) => {
  try {
    const visits = await prisma.visitRequest.findMany({
      where: {
        OR: [{ requesterId: req.user.id }, { ownerId: req.user.id }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            images: { take: 1 },
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(visits);
  } catch (error) {
    console.error("Get visits error:", error);
    res.status(500).json({ message: "Server error fetching visits" });
  }
};
