import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw new Error();
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Optional Auth - allows both authenticated and unauthenticated requests
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (token) {
    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // If token is invalid, just continue without user
    }
  }

  next();
};

// Require Admin Role
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Require Landlord Role
export const requireLandlord = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "LANDLORD" && req.user?.role !== "ADVERTISER") {
    return res
      .status(403)
      .json({
        error:
          "Only landlords and advertisers can post rooms. Please upgrade your account.",
      });
  }
  next();
};

// Require User (Tenant) Role
export const requireUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.user?.role !== "USER") {
    return res
      .status(403)
      .json({ error: "This feature is only available for tenants/users." });
  }
  next();
};

// Require Landlord or User Role (for features both can use)
export const requireLandlordOrUser = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  if (
    req.user?.role !== "LANDLORD" &&
    req.user?.role !== "USER" &&
    req.user?.role !== "ADVERTISER"
  ) {
    return res.status(403).json({ error: "Access denied." });
  }
  next();
};
