import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/jwt";

const prisma = new PrismaClient();

export const signup = async (req: Request, res: Response) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      phoneNumber,
      university,
      bio,
      preferences
    } = req.body;

    // Validate role
    const validRoles = ["USER", "LANDLORD", "ADVERTISER"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be USER or LANDLORD" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

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
    res.status(201).json({ user, token });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
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
