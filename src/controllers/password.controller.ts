// Forgot Password & Reset Password Controllers

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Store reset tokens in memory (in production, use Redis or database)
const resetTokens = new Map<string, { userId: string; expires: Date }>();

// Request password reset
export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.json({ message: 'If that email exists, a reset link has been sent' });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Store token
        resetTokens.set(resetToken, {
            userId: user.id,
            expires
        });

        // TODO: Send email with reset link
        // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        // await sendEmail(user.email, 'Password Reset', resetUrl);

        console.log(`Password reset token for ${email}: ${resetToken}`);

        res.json({ message: 'If that email exists, a reset link has been sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
};

// Reset password with token
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        const tokenData = resetTokens.get(token);

        if (!tokenData || tokenData.expires < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await prisma.user.update({
            where: { id: tokenData.userId },
            data: { password: hashedPassword }
        });

        // Delete used token
        resetTokens.delete(token);

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
};

// Verify reset token
export const verifyResetToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;

        const tokenData = resetTokens.get(token);

        if (!tokenData || tokenData.expires < new Date()) {
            return res.status(400).json({ valid: false });
        }

        res.json({ valid: true });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Failed to verify token' });
    }
};
