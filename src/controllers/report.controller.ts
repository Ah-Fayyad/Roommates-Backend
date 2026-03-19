// Report Controller - Handle user and listing reports

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth.middleware";

const prisma = new PrismaClient();

// Create report
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { targetType, targetId, reason, description } = req.body;

    console.log("Create report - userId:", userId);
    console.log("Create report - body:", {
      targetType,
      targetId,
      reason,
      description,
    });

    // Check if user is authenticated
    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized - User ID not found" });
    }

    // Validate input
    if (!targetType || !targetId || !reason || !description) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate target type
    if (!["USER", "LISTING"].includes(targetType)) {
      return res.status(400).json({ error: "Invalid target type" });
    }

    // Check if target exists
    if (targetType === "USER") {
      const user = await prisma.user.findUnique({ where: { id: targetId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
    } else {
      const listing = await prisma.listing.findUnique({
        where: { id: targetId },
      });
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }
    }

    // Prepare data
    const reportData: any = {
      reporterId: userId!,
      targetType,
      reason,
      description,
      status: "PENDING",
    };

    if (targetType === "USER") {
      reportData.reportedUserId = targetId;
    } else {
      reportData.reportedListingId = targetId;
    }

    console.log("Creating report in database...");
    // Create report
    const report = await prisma.report.create({
      data: reportData,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
    console.log("Report created successfully in DB:", report.id);

    res.status(201).json(report);
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: "Failed to create report" });
  }
};

// Get all reports (Admin only)
export const getAllReports = async (req: Request, res: Response) => {
  try {
    const { status, targetType } = req.query;

    const where: any = {};
    if (status) where.status = status;
    if (targetType) where.targetType = targetType;

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            role: true,
            isBanned: true,
          },
        },
        reportedListing: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            price: true,
            status: true,
            owner: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        }
      },
      orderBy: { createdAt: "desc" },
    });

    // Map to a cleaner structure for frontend (unify reportedUser/reportedListing into 'reported')
    const enrichedReports = reports.map(report => ({
      ...report,
      reported: report.targetType === 'USER' ? report.reportedUser : report.reportedListing
    }));

    res.json(enrichedReports);
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
};

// Update report status (Admin only)
export const updateReportStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, action } = req.body;

    // Get the report first
    const report = await prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Handle actions (BAN, REMOVE_LISTING, etc.)
    const targetId = report.targetType === 'USER' ? report.reportedUserId : report.reportedListingId;

    if (targetId) {
      if (action === "BAN_USER" && report.targetType === "USER") {
        await prisma.user.update({
          where: { id: targetId },
          data: { isBanned: true },
        });
      } else if (action === "REMOVE_LISTING" && report.targetType === "LISTING") {
        await prisma.listing.update({
          where: { id: targetId },
          data: { status: "INACTIVE" },
        });
      } else if (action === "UNBAN_USER" && report.targetType === "USER") {
        await prisma.user.update({
          where: { id: targetId },
          data: { isBanned: false },
        });
      }
    }

    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status,
        adminNotes,
      },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    res.json(updatedReport);
  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
};

// Get user's reports
export const getUserReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const reports = await prisma.report.findMany({
      where: { reporterId: userId },
      include: {
        reportedListing: {
          select: { title: true }
        },
        reportedUser: {
          select: { fullName: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(reports);
  } catch (error) {
    console.error("Get user reports error:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
};

