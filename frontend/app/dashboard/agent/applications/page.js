"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
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

export default function AgentApplications() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/agent/applications`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        });
        const data = await response.json();
        setApplications(data.applications || []);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchApplications();
    }
  }, [session]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/agent/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      }
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={['agent']}>
      <DashboardLayout sidebarItems={agentSidebarItems}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Applications Management</h1>
          <p className="text-gray-600">Review and manage rental applications</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['all', 'pending', 'under_review', 'approved', 'rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    filter === status
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No applications found for the selected filter.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {application.applicant_name?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.applicant_name || 'Unknown Applicant'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.applicant_email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {application.property_title || 'Property Title'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.property_address || 'Property Address'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(application.status)}`}>
                        {application.status?.replace('_', ' ') || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          className="text-green-600 hover:text-green-900"
                          disabled={application.status === 'approved'}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          className="text-red-600 hover:text-red-900"
                          disabled={application.status === 'rejected'}
                        >
                          Reject
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}