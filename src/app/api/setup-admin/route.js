import { connectMongo } from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectMongo();

    const email = 'stkrfx@gmail.com';
    const password = 'stkrfx1234'; // Change this after logging in
    
    // Check if exists to prevent duplicates
    const existing = await User.findOne({ email, role: 'admin' });
    if (existing) {
      return NextResponse.json({ message: 'Admin already exists', email });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: 'Super Admin',
      email,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      roles: ['admin'] // For forward compatibility if you use the array approach later
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin created successfully', 
      credentials: { email, password } 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}