"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';

export default function ApplicationsPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    if (session) {
      fetchApplications();
    }
  }, [session, filter]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/applications/?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId, action, reason = '') => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/applications/${applicationId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) throw new Error('Failed to update application');
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('Error updating application:', error);
      setError(error.message);
    }
  };

 
  if (!session || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Applications Management</h1>
          <div className="space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Applications</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Rental Applications</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {applications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No applications found
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <img
                        src={application.student?.avatar || '/default-avatar.svg'}
                        alt={application.student?.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{application.student?.name}</h3>
                        <p className="text-sm text-gray-600">{application.student?.email}</p>
                        <p className="text-sm text-gray-600">University: {application.student?.university}</p>
                        <div className="mt-2">
                          <span className="text-sm font-medium">Property: </span>
                          <span className="text-sm text-gray-600">{application.listing?.title}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm font-medium">Landlord: </span>
                          <span className="text-sm text-gray-600">{application.listing?.landlord?.name}</span>
                        </div>
                        <div className="mt-1">
                          <span className="text-sm font-medium">Applied on: </span>
                          <span className="text-sm text-gray-600">
                            {new Date(application.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {application.status}
                      </span>
                      {application.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApplicationAction(application.id, 'approve')}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {application.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{application.message}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
