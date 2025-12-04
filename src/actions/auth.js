'use server';

import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import bcrypt from 'bcryptjs';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from 'crypto';
import { 
  uniqueNamesGenerator, 
  adjectives, 
  animals 
} from 'unique-names-generator';

// Generator: "adjectiveanimal" (e.g. "happylion", "bravefalcon")
// No numbers, no hyphens, 2 words only.
function generateReadableUsername() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: '',
    length: 2,
    style: 'lowerCase' 
  });
}

// Generator: "Adjective Animal" (e.g. "Happy Lion") for Full Name
// Capitalized with space for better readability as a Name.
function generateHumanName() {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: ' ',
    length: 2,
    style: 'capital'
  });
}

// --- 1. CREATE NEW USER (Admin Only) ---
export async function createNewUser(data) {
  const session = await getServerSession(authOptions);
  
  // SECURITY: Only Admins can create users
  if (!session || session.user.role !== 'admin') {
    return { error: "Unauthorized access" };
  }

  await connectMongo();

  // A. Check for Duplicates
  const existing = await User.findOne({ email: data.email, role: data.role });
  if (existing) {
    return { error: `A ${data.role} account with this email already exists.` };
  }

  // B. Generate Credentials
  const tempPassword = crypto.randomBytes(4).toString('hex') + 'A1!'; 
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  // C. Generate Unique Username (Clean & Readable)
  let username = generateReadableUsername();
  let isUnique = false;
  
  // Ensure absolute uniqueness
  while (!isUnique) {
    const check = await User.findOne({ username });
    if (!check) isUnique = true;
    else username = generateReadableUsername(); // Retry if taken
  }

  // D. Generate Name if missing
  const finalName = data.name && data.name.trim() !== '' ? data.name : generateHumanName();

  // E. Create User Document
  const newUser = await User.create({
    name: finalName,
    email: data.email,
    username: username,
    password: hashedPassword,
    role: data.role,
    
    // Force them to verify & change password on first login
    forcePasswordChange: true,
    isVerified: false,
    
    settings: {
      theme: 'system',
      notifications: true,
      onboardingComplete: false
    }
  });

  return {
    success: true,
    credentials: {
      email: newUser.email,
      username: newUser.username,
      tempPassword: tempPassword,
      role: newUser.role,
      name: newUser.name
    }
  };
}

// --- 2. UPDATE PASSWORD (Self Service) ---
export async function updatePassword(newPassword) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  await connectMongo();
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await User.findByIdAndUpdate(session.user.id, {
    password: hashedPassword,
    forcePasswordChange: false // Mark as setup complete
  });

  return { success: true };
}