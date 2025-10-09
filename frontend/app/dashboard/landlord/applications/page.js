'use client';
import { useState, useEffect } from 'react';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/landlord/applications`);
      if (!response.ok) throw new Error('Failed to fetch applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Rental Applications</h1>
      
      <div className="bg-white rounded-lg shadow">
        {applications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No applications received yet
          </div>
        ) : (
          <div className="divide-y">
            {/* Applications list will be populated here */}
          </div>
        )}
      </div>
    </div>
  );
}