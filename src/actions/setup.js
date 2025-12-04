'use server';

import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import { sendEmail } from "@/lib/email";
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from 'crypto';
import { limitKey } from "@/lib/rateLimiter";

// 0. Get User Data (Safe Serialization)
export async function getSetupUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    await connectMongo();
    // Use .lean() and explicit selection to avoid large objects
    const user = await User.findById(session.user.id)
      .select('name username email photo')
      .lean();
    
    if (!user) return null;

    // Return simple object (force serialization)
    return {
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      photo: user.photo || ''
    };
  } catch (error) {
    console.error("Get Setup User Error:", error);
    return null; // Return null safely instead of throwing
  }
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

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); 

  user.verificationOTP = otp;
  user.verificationOTPExpiry = expiry;
  await user.save();

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; text-align: center;">
      <h2>Verify your Account</h2>
      <p>Your verification code is:</p>
      <h1 style="background: #f4f4f5; padding: 10px 20px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
    </div>
  `;

  await sendEmail({ to: user.email, subject: "Verification Code", html: emailHtml });
  return { success: true };
}

// 2. Verify OTP & Set Password
export async function verifyAndSetPassword({ otp, password }) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await connectMongo();
  const user = await User.findById(session.user.id).select('+verificationOTP +verificationOTPExpiry');

  if (!user) return { error: "User not found" };
  
  if (!user.verificationOTP || user.verificationOTP !== otp) {
    return { error: "Invalid verification code" };
  }
  if (new Date() > user.verificationOTPExpiry) {
    return { error: "Verification code has expired" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  user.password = hashedPassword;
  user.isVerified = true;
  user.verificationOTP = undefined;
  user.verificationOTPExpiry = undefined;
  user.forcePasswordChange = false; // Unlock account immediately
  
  await user.save();
  return { success: true };
}

// 3. Update Profile
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