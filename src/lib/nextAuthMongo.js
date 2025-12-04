import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

/**
 * Verifies email/password specifically for the Admin Portal.
 * It strictly queries for role: 'admin' to avoid logging in
 * as a regular 'user' who happens to share the same email.
 */
export async function verifyCredentials(email, password) {
  await connectMongo();

  const user = await User.findOne({ 
    email: email.toLowerCase(),
    role: 'admin' // CRITICAL: Only find admin accounts
  });

  if (!user) {
    return null;
  }

  // Use bcryptjs to compare hashed password
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Finds a user by email (helper for OAuth or generic lookups).
 * Defaulting to finding admin to ensure security in this portal.
 */
export async function findUserByEmail(email) {
  await connectMongo();
  return User.findOne({ 
    email: email.toLowerCase(),
    role: 'admin'
  });
}

/**
 * Handles Google OAuth Sign-in for Admins.
 * Note: We generally do NOT want to auto-create Admins via Google.
 * We only want to link if the Admin account already exists.
 */
export async function createOrLinkGoogleAccount(profile) {
  await connectMongo();
  
  const user = await User.findOne({ 
    email: profile.email.toLowerCase(),
    role: 'admin' 
  });

  if (!user) {
    // If no admin account exists, we return null.
    // This prevents random people from signing up as admins via Google.
    return null;
  }

  // Update their photo from Google if it's missing
  if (!user.photo && profile.picture) {
    user.photo = profile.picture;
    await user.save();
  }

  return user;
}