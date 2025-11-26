'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  ApplicationVerificationCard,
  VerificationFilterBar,
} from '@/components/verification';

/**
 * Landlord Applications Page with Verification Display
 * 
 * Example implementation showing verification status in applications.
 */
export default function ApplicationsWithVerificationPage() {
  const { data: session } = useSession();
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date_desc');

  useEffect(() => {
    fetchApplications();
  }, [filter, sort]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/verification/landlord/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ filter, sort }),
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (applicationId) => {
    // Implement approval logic
    console.log('Approve:', applicationId);
  };

  const handleReject = async (applicationId) => {
    // Implement rejection logic
    console.log('Reject:', applicationId);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Student Applications
        </h1>
        <p className="text-gray-600">
          Review applications with verification status
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Applications</div>
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700 mb-1">✓ Verified</div>
            <div className="text-2xl font-bold text-green-900">{summary.verified}</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">📧 Basic</div>
            <div className="text-2xl font-bold text-blue-900">{summary.basic}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm text-gray-700 mb-1">○ Unverified</div>
            <div className="text-2xl font-bold text-gray-900">{summary.unverified}</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6">
        <VerificationFilterBar
          onFilterChange={setFilter}
          onSortChange={setSort}
        />
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((application) => (
            <ApplicationVerificationCard
              key={application.id}
              application={application}
              showActions={true}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Applications Found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters to see more results
          </p>
        </div>
      )}
    </div>
  );
}
