import { Suspense } from 'react';
import { getDashboardStats } from '@/actions/stats';
import RevenueWidget from '@/components/dashboard/RevenueWidget';
import StatCard from '@/components/dashboard/StatCard';
import { 
  Users, GraduationCap, Building2, ShieldAlert, 
  MousePointer2 
} from 'lucide-react';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  // Handle fallback if DB connection fails
  const safeStats = stats || {
    users: { count: 0, trend: '0%' },
    experts: 0,
    orgs: 0,
    pendingExperts: 0,
    financial: { unsettled: {}, refunds: {}, revenue: {} }
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Financial Overview
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Real-time breakdown of transactions from the Payment Ledger.
          </p>
        </div>
      </div>

      {/* 1. Real Financial Data */}
      <RevenueWidget data={safeStats.financial} />

      <div className="border-t border-slate-100"></div>

      {/* 2. Platform Statistics (Unified Redirection) */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Platform Statistics
            </h2>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <MousePointer2 size={14} /> 
              Click cards to filter the master User List
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          
          <StatCard 
            title="Total Users" 
            value={safeStats.users.count} 
            icon={Users} 
            color="blue"
            description="Active users on platform"
            // UNIFIED LINK: Just filters for 'user' role
            link="/dashboard/users?role=user"
            trend={`${safeStats.users.trend} vs last mo.`}
          />
          
          <StatCard 
            title="Verified Experts" 
            value={safeStats.experts} 
            icon={GraduationCap} 
            color="purple"
            description="Experts offering services"
            // UNIFIED LINK: Filters for 'expert' role
            link="/dashboard/users?role=expert"
            trend="Active Professionals"
          />
          
          <StatCard 
            title="Organisations" 
            value={safeStats.orgs} 
            icon={Building2} 
            color="indigo"
            description="Partnered institutions"
            // UNIFIED LINK: Filters for 'organisation' role
            link="/dashboard/users?role=organisation"
            trend="Partners"
          />
          
          <StatCard 
            title="Pending Approvals" 
            value={safeStats.pendingExperts} 
            icon={ShieldAlert} 
            color="amber"
            description="Experts waiting for verification"
            // UNIFIED LINK: Filters for 'expert' role AND 'pending' status
            link="/dashboard/users?role=expert&status=pending"
            trend="Action Required"
          />
          
        </div>
      </div>
    </div>
  );
}