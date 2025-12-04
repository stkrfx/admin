'use server';

import { connectMongo } from "@/lib/db";
import User from "@/lib/models/User";
import Expert from "@/lib/models/Expert";
import Organisation from "@/lib/models/Organisation";
import Payment from "@/lib/models/Payment";
import Appointment from "@/lib/models/Appointment"; // Needed for refund logic
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getDashboardStats() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    await connectMongo();

    // 1. Calculate Date Ranges for Trends (This Month vs Last Month)
    const now = new Date();
    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const firstDayLastYear = new Date(now.getFullYear() - 1, 0, 1); // Jan 1st last year

    // 2. Fetch Entity Counts & Trends
    const [
      totalUsers, lastMonthUsers,
      totalExperts, 
      totalOrgs, 
      pendingExperts
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $lt: firstDayCurrentMonth } }),
      User.countDocuments({ role: 'expert' }),
      User.countDocuments({ role: 'organisation' }),
      Expert.countDocuments({ underVerification: true }),
    ]);

    // Calculate User Growth Trend
    const userGrowth = lastMonthUsers === 0 ? 100 : ((totalUsers - lastMonthUsers) / lastMonthUsers) * 100;

    // 3. FINANCIAL CALCULATIONS
    
    // A. Unsettled Funds (Held in Payment collection but not settled)
    // We assume 60/20/10/10 split rule applies to the total unsettled amount
    const unsettledPayments = await Payment.find({ settled: false, status: 'completed' });
    const unsettledTotal = unsettledPayments.reduce((acc, p) => acc + p.amount, 0);
    
    const financialBreakdown = {
      expert: unsettledTotal * 0.60,
      org: unsettledTotal * 0.20,
      tax: unsettledTotal * 0.10,
      adminNet: unsettledTotal * 0.10 
    };

    // B. Refunds Needed (Actionable Item)
    // Find Appointments that are CANCELLED but Payment is PAID
    const refundableAppointments = await Appointment.find({ 
      status: 'cancelled', 
      paymentStatus: 'paid' 
    });
    
    const totalRefundable = refundableAppointments.reduce((acc, appt) => acc + (appt.price || 0), 0);
    
    // C. Gross Revenue (Last Year vs This Year)
    // Sum of all completed payments created since last year
    const revenuePayments = await Payment.find({ 
      status: 'completed',
      createdAt: { $gte: firstDayLastYear }
    });
    
    const revenueLastYearTotal = revenuePayments.reduce((acc, p) => acc + p.amount, 0);

    return {
      users: {
        count: totalUsers,
        trend: userGrowth > 0 ? `+${userGrowth.toFixed(1)}%` : `${userGrowth.toFixed(1)}%`
      },
      experts: totalExperts,
      orgs: totalOrgs,
      pendingExperts: pendingExperts,
      financial: {
        unsettled: {
          total: unsettledTotal,
          breakdown: financialBreakdown
        },
        refunds: {
          totalRefundable: totalRefundable,
          pendingCount: refundableAppointments.length,
          cancellationFees: totalRefundable * 0.10 // Assuming 10% fee logic, or adjust as needed
        },
        revenue: {
          lastYearGross: revenueLastYearTotal,
          growth: 12.5 // You can implement similar trend logic for revenue if historical data exists
        }
      }
    };
  } catch (error) {
    console.error("Stats Error:", error);
    return null;
  }
}