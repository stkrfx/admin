'use server';

import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import Expert from "@/lib/models/Expert";
import Organisation from "@/lib/models/Organisation";
import Report from "@/lib/models/Report";
import { getServerSession } from "next-auth";
// CHANGE THIS IMPORT
import { authOptions } from "@/lib/auth"; 

export async function getDashboardStats() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      throw new Error("Unauthorized");
    }

    await connectMongo();

    const [
      userCount, 
      expertCount, 
      orgCount, 
      pendingReports
    ] = await Promise.all([
      User.countDocuments({}),
      Expert.countDocuments({}),
      Organisation.countDocuments({}),
      Report.countDocuments({ status: 'pending' }),
    ]);

    return {
      users: userCount,
      experts: expertCount,
      organisations: orgCount,
      pendingReports: pendingReports,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return null;
  }
}