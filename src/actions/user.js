'use server';

import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// --- FETCH USERS (With Pagination, Search, Filters) ---
export async function getUsers({ role, status, q, page = 1, limit = 25, filterType }) {
  try {
    const session = await getServerSession(authOptions);
    
    // SECURITY: Strictly Admin Only
    if (!session || session.user.role !== 'admin') {
      return { error: "Unauthorized: Admin access only." };
    }

    await connectMongo();

    const query = {};

    // 1. Self-Exclusion: Admin should not see/edit their own account in this list
    query._id = { $ne: session.user.id };

    // 2. Role Filter
    if (role && role !== 'all') {
      query.role = role;
    }

    // 3. Status Filter
    if (status === 'banned') {
      query.isBanned = true;
    } else if (status === 'active') {
      query.isBanned = false;
      query.isVerified = true; 
    } else if (status === 'pending') {
      query.isVerified = false;
      query.isBanned = false; 
    }

    // 4. "Stale" Filter (Unverified for > 6 months)
    if (filterType === 'stale') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      query.isVerified = false;
      query.createdAt = { $lt: sixMonthsAgo };
    }

    // 5. Search (Regex)
    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [
        { name: { $regex: regex } },
        { email: { $regex: regex } },
        { username: { $regex: regex } }
      ];
    }

    // 6. Pagination Logic
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    // 7. Execute Query
    const [users, totalCount] = await Promise.all([
      User.find(query)
        .select('-password -verificationOTP') // Exclude sensitive fields
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(query)
    ]);

    // Serialize for Client
    const serializedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString(),
      createdAt: user.createdAt?.toISOString(),
      updatedAt: user.updatedAt?.toISOString(),
    }));

    return { 
      success: true, 
      users: serializedUsers,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      }
    };

  } catch (error) {
    console.error("Get Users Error:", error);
    return { error: "Failed to fetch users" };
  }
}

// --- SINGLE USER ACTIONS ---

export async function toggleUserBan(email, shouldBan) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { error: "Unauthorized" };

    await connectMongo();

    // Bans/Unbans ALL roles associated with this email (Global Ban)
    const result = await User.updateMany(
      { email: email }, 
      { $set: { isBanned: shouldBan } }
    );

    revalidatePath('/dashboard/users');
    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error("Ban Error:", error);
    return { error: "Failed to update ban status" };
  }
}

export async function deleteUser(userId) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { error: "Unauthorized" };

    await connectMongo();

    const user = await User.findById(userId);
    if (!user) return { error: "User not found" };

    // Safety: Only allow deleting unverified users to preserve history
    if (user.isVerified) {
      return { error: "Cannot delete a verified user. Please ban them instead." };
    }

    await User.findByIdAndDelete(userId);
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { error: "Failed to delete user" };
  }
}

// --- BULK ACTIONS ---

export async function bulkToggleUserBan(emails, shouldBan) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { error: "Unauthorized" };

    await connectMongo();

    await User.updateMany(
      { email: { $in: emails } }, 
      { $set: { isBanned: shouldBan } }
    );

    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error("Bulk Ban Error:", error);
    return { error: "Failed to update users" };
  }
}

export async function bulkDeleteUsers(userIds) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') return { error: "Unauthorized" };

    await connectMongo();

    // Safety: Only delete users that are NOT verified
    const result = await User.deleteMany({ 
      _id: { $in: userIds }, 
      isVerified: false 
    });

    revalidatePath('/dashboard/users');
    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error("Bulk Delete Error:", error);
    return { error: "Failed to delete users" };
  }
}