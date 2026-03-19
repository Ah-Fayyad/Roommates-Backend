import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";
import { OAuth2Client } from "google-auth-library";

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signup = async (req: Request, res: Response) => {
  try {
    console.log("📝 Signup request received:", {
      email: req.body.email,
      fullName: req.body.fullName,
      role: req.body.role,
    });

    const {
      email,
      password,
      fullName,
      role,
      phoneNumber,
      university,
      bio,
      companyName,
      licenseNumber,
      preferences
    } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      console.log("❌ Missing required fields", { email: !!email, password: !!password, fullName: !!fullName });
      return res.status(400).json({ message: "Email, password, and full name are required" });
    }

    // Validate role
    const validRoles = ["USER", "LANDLORD", "ADVERTISER"];
    if (role && !validRoles.includes(role)) {
      console.log("❌ Invalid role:", role);
      return res.status(400).json({ message: "Invalid role. Must be USER, LANDLORD, or ADVERTISER" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ message: "User already exists with this email" });
    }

    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and related preferences in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role: role || "USER",
          phoneNumber: phoneNumber || null,
          university: university || null,
          bio: bio || null,
          companyName: companyName || null,
          licenseNumber: licenseNumber || null,
        }
      });

      // Create preferences if it's a tenant or if provided
      if (preferences || role === "USER") {
        await tx.preference.create({
          data: {
            userId: newUser.id,
            cleanliness: preferences?.cleanliness || 5,
            studyHabits: preferences?.studyHabits || 5,
            quietHours: preferences?.quietHours || 5,
            socializing: preferences?.socializing || 5,
            cooking: preferences?.cooking || 5,
            smoking: preferences?.smoking || false,
            guests: preferences?.guests || true,
            pets: preferences?.pets || false,
            sleepSchedule: preferences?.sleepSchedule || "FLEXIBLE",
            workSchedule: preferences?.workSchedule || "STUDENT",
            budget: preferences?.budget || 500,
          }
        });
      }

      return await tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatar: true,
          phoneNumber: true,
          university: true,
          bio: true,
          isVerified: true,
          createdAt: true,
          preferences: true,
        }
      });
    });

    const token = generateToken(user!.id);
    console.log("✅ User created successfully:", user?.id);
    res.status(201).json({ user, token });
  } catch (error: any) {
    console.error("❌ Signup error:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    res.status(500).json({
      message: "Failed to create account",
      error: error.message,
      debug: error.code,
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "This account is linked to Google. Please use Google Login or reset your password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned. Please contact support." });
    }

    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const googleLogin = async (req: Request, res: Response) => {
  try {
    const { token, isAccessToken, role } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    let email: string | undefined;
    let googleId: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    if (isAccessToken) {
      // Fetch user profile from Google using access token
      const userInfoRes = await (await import("axios")).default.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = userInfoRes.data;
      email = profile.email;
      googleId = profile.sub;
      name = profile.name;
      picture = profile.picture;
    } else {
      // Verify ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({ message: "Invalid Google token" });
      }
      email = payload.email;
      googleId = payload.sub;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ message: "Could not retrieve email from Google" });
    }

    // 1. Check if user exists by email
    let user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true, email: true, fullName: true, role: true,
        avatar: true, isVerified: true, isBanned: true,
        googleId: true, phoneNumber: true
      }
    });

    if (user && user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned." });
    }

    let isNewUser = false;
    if (!user) {
      isNewUser = true;
      // 2. Create new user
      console.log("🆕 Creating new user via Google:", email);
      const newUser = await prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            fullName: name || "Google User",
            googleId,
            avatar: picture || null,
            role: role || "USER",
            isVerified: true,
          }
        });
        await tx.preference.create({
          data: {
            userId: created.id,
            cleanliness: 5, studyHabits: 5, quietHours: 5,
            socializing: 5, cooking: 5, budget: 500,
          }
        });
        return created;
      });
      user = {
        id: newUser.id, email: newUser.email, fullName: newUser.fullName,
        role: newUser.role as any, avatar: newUser.avatar,
        isVerified: newUser.isVerified, isBanned: newUser.isBanned,
        googleId: newUser.googleId, phoneNumber: newUser.phoneNumber
      };
    } else if (!user.googleId) {
      // 3. Link Google account to existing user
      console.log("🔗 Linking Google account:", email);
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: picture || user.avatar, isVerified: true }
      });
      user = { ...user, googleId: updated.googleId, avatar: updated.avatar, isVerified: true };
    }

    const jwtToken = generateToken(user.id);
    console.log("✅ Google login success:", user.email);

    res.json({
      user: {
        id: user.id, email: user.email, fullName: user.fullName,
        role: user.role, avatar: user.avatar,
        isVerified: user.isVerified, phoneNumber: user.phoneNumber,
      },
      token: jwtToken,
      isNewUser
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Google authentication failed", error });
  }
};
