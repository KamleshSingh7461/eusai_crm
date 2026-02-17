"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

// Import Role-Based Dashboards
import DirectorDashboard from '@/components/dashboard/DirectorDashboard';
import ManagerDashboard from '@/components/dashboard/ManagerDashboard';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import TeamLeaderDashboard from '@/components/dashboard/TeamLeaderDashboard';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      setUserRole((session.user as any).role || 'EMPLOYEE');
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex bg-[#191919] h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2383e2]" />
      </div>
    );
  }

  // Render Dashboard based on Role
  const renderDashboard = () => {
    switch (userRole) {
      case 'DIRECTOR':
        return <DirectorDashboard />;
      case 'MANAGER':
        return <ManagerDashboard />;
      case 'TEAM_LEADER':
        return <TeamLeaderDashboard />;
      case 'EMPLOYEE':
      case 'INTERN':
      default:
        return <EmployeeDashboard />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {renderDashboard()}
    </div>
  );
}
