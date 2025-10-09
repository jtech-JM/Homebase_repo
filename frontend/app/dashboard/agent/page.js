"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActionCard from '@/components/dashboard/ActionCard';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

const agentSidebarItems = [
  { label: 'Overview', href: '/dashboard/agent', icon: '📊' },
  { label: 'Student Support', href: '/dashboard/agent/students', icon: '👨‍🎓' },
  { label: 'Landlord Support', href: '/dashboard/agent/landlords', icon: '🏘️' },
  { label: 'Property Verification', href: '/dashboard/agent/verification', icon: '✅' },
  { label: 'Applications', href: '/dashboard/agent/applications', icon: '📝' },
  { label: 'Tasks', href: '/dashboard/agent/tasks', icon: '📋' },
  { label: 'Reports', href: '/dashboard/agent/reports', icon: '📈' },
];

export default function AgentDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    studentsAssisted: 0,
    landlordsOnboarded: 0,
    propertiesVerified: 0,
    activeDisputes: 0,
  });

  const [tasks, setTasks] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState([]);

  useEffect(() => {
    // Fetch agent dashboard data
    const fetchDashboardData = async () => {
      try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent/dashboard`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });
        const data = await response.json();
        setStats(data.stats);
        setTasks(data.tasks);
        setPendingVerifications(data.pendingVerifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <RoleProtectedLayout allowedRoles={['agent']}>
      <DashboardLayout sidebarItems={agentSidebarItems}>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Agent Dashboard</h1>
        <p className="text-gray-600">Manage verifications and support requests</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Students Assisted"
          value={stats.studentsAssisted}
          icon="👨‍🎓"
        />
        <StatCard
          title="Landlords Onboarded"
          value={stats.landlordsOnboarded}
          icon="🏘️"
        />
        <StatCard
          title="Properties Verified"
          value={stats.propertiesVerified}
          icon="✅"
        />
        <StatCard
          title="Active Disputes"
          value={stats.activeDisputes}
          icon="⚠️"
        />
      </div>

      {/* Tasks and Verifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Today's Tasks</h2>
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <ActionCard
                key={index}
                title={task.title}
                description={task.description}
                actionLabel={task.actionLabel}
                icon={task.icon}
                onAction={() => {}}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Pending Verifications</h2>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <ul className="space-y-4">
              {pendingVerifications.map((verification, index) => (
                <li key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <span className="text-yellow-500">⏳</span>
                  <div className="flex-1">
                    <p className="font-medium">{verification.type}</p>
                    <p className="text-sm text-gray-500">{verification.details}</p>
                    <div className="mt-2 flex space-x-2">
                      <button className="px-3 py-1 bg-green-500 text-white rounded-md text-sm">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-500 text-white rounded-md text-sm">
                        Reject
                      </button>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">{verification.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Support Requests */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Support Requests</h2>
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Add support requests rows here */}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
    </RoleProtectedLayout>
  );
}