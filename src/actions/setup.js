'use server';

import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/email";
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from 'crypto';
import { limitKey } from "@/lib/rateLimiter";

// --- NEW: Helper to fetch current user details for the setup form ---
export async function getSetupUser() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  await connectMongo();
  const user = await User.findById(session.user.id).select('name username email photo').lean();
  
  if (!user) return null;

  return {
    name: user.name,
    username: user.username, // Fetched from DB
    email: user.email,
    photo: user.photo
  };
}

// 1. Send OTP
export async function sendVerificationOTP() {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  const limit = await limitKey(`otp:${session.user.id}`);
  if (!limit.success) return { error: "Too many requests. Please wait a minute." };

  await connectMongo();
  const user = await User.findById(session.user.id);
  if (!user) return { error: "User not found" };

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  user.verificationOTP = otp;
  user.verificationOTPExpiry = expiry;
  await user.save();

  // Send Email
  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; text-align: center; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #333;">Verify your Account</h2>
      <p style="color: #666;">Your secure verification code is:</p>
      <div style="background: #f4f4f5; padding: 15px; margin: 20px 0; border-radius: 8px; display: inline-block;">
        <span style="font-size: 24px; font-weight: bold; letter-spacing: 8px; color: #000;">${otp}</span>
      </div>
      <p style="color: #999; font-size: 12px;">Valid for 10 minutes.</p>
    </div>
  `;

  await sendEmail({ to: user.email, subject: "Your Verification Code", html: emailHtml });
  return { success: true };
}

// 2. Verify OTP & Set Password (UNLOCKS ACCOUNT)
export async function verifyAndSetPassword({ otp, password }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await connectMongo();
  const user = await User.findById(session.user.id).select('+verificationOTP +verificationOTPExpiry');

  if (!user) return { error: "User not found" };
  
  // Validate OTP
  if (!user.verificationOTP || user.verificationOTP !== otp) {
    return { error: "Invalid verification code" };
  }
  if (new Date() > user.verificationOTPExpiry) {
    return { error: "Verification code has expired" };
  }

  // Update Password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  user.password = hashedPassword;
  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpiry = undefined;
  
  // CRITICAL: We unlock the account here so Step 3 is truly optional
  user.forcePasswordChange = false; 
  
  await user.save();
  return { success: true };
}

// 3. Update Profile (Optional Step)
export async function completeProfileSetup({ name, username, photo }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await connectMongo();
  const user = await User.findById(session.user.id);

  if (!user) return { error: "User not found" };

  if (name) user.name = name;
  if (photo) user.photo = photo;
  
  if (username && username !== user.username) {
    const exists = await User.findOne({ username });
    if (exists) return { error: "Username is already taken" };
    user.username = username;
  }
  
  await user.save();
  return { success: true };
}