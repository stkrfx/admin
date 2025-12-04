import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import DashboardLayoutClient from './DashboardLayoutClient'; // NEW Client Wrapper

export const metadata = {
  title: 'Admin Dashboard | Mind Namo',
};

export default async function DashboardLayout({ children }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  if (session?.user?.role !== 'admin' && session?.user?.role !== 'organisation') {
    return redirect('/login');
  }

  return (
    <DashboardLayoutClient user={session.user}>
      {children}
    </DashboardLayoutClient>
  );
}