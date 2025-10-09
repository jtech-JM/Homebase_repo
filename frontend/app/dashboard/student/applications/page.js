'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/student/applications`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">My Applications</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">You haven't submitted any applications yet.</p>
            <Link
              href="/dashboard/student/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
            >
              Browse Properties
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Rent
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={application.property.image || "/placeholder.png"}
                          alt=""
                          className="h-10 w-10 rounded-md object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.property.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.property.address}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        getStatusBadgeColor(application.status)
                      }`}>
                        {application.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${application.property.monthlyRent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/dashboard/student/applications/${application.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}