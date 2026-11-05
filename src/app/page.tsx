"use client";

import { useSession } from 'next-auth/react';
import DirectorDashboard from '@/components/dashboard/DirectorDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import TeamLeaderDashboard from '@/components/dashboard/TeamLeaderDashboard';
import { DashboardSkeleton } from '@/components/dashboard/widgets';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session?.user) return <DashboardSkeleton />;

  switch ((session.user as any).role) {
    case 'DIRECTOR':
    case 'MANAGEMENT':
      return <DirectorDashboard />;
    case 'MANAGER':
      return <ManagerDashboard />;
    case 'TEAM_LEADER':
      return <TeamLeaderDashboard />;
    default:
      return <EmployeeDashboard />;
  }
}
