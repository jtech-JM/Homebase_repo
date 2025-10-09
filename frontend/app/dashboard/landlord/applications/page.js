'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { landlordSidebarItems } from '../page';

export default function ApplicationsPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchApplications();
    }
  }, [session]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/applications/`, {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/applications/${applicationId}/`, {
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

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Rental Applications</h1>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          {applications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No applications received yet
            </div>
          ) : (
            <div className="divide-y">
              {applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <img
                        src={application.student.avatar || '/default-avatar.png'}
                        alt={application.student.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">{application.student.name}</h3>
                        <p className="text-sm text-gray-600">{application.student.email}</p>
                        <p className="text-sm text-gray-600">{application.student.university}</p>
                        <div className="mt-2">
                          <span className="text-sm font-medium">Applied for: </span>
                          <span className="text-sm text-gray-600">{application.listing.title}</span>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
