'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminVerificationReview() {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      let endpoint = '/api/verification/admin/reviews/';
      if (filter === 'pending') {
        endpoint = '/api/verification/admin/reviews/pending_reviews/';
      } else if (filter === 'low_quality') {
        endpoint = '/api/verification/admin/reviews/low_quality_documents/';
      } else if (filter === 'my_assignments') {
        endpoint = '/api/verification/admin/reviews/my_assignments/';
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerifications(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (verificationId, action) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verification/admin/reviews/${verificationId}/${action}/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notes: actionNotes }),
        }
      );

      if (response.ok) {
        alert(`Verification ${action} successfully!`);
        setActionNotes('');
        setSelectedVerification(null);
        fetchVerifications();
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
      alert(`Failed to ${action} verification`);
    } finally {
      setActionLoading(false);
    }
  };

  const assignToMe = async (verificationId) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/verification/admin/reviews/${verificationId}/assign_to_me/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        alert('Verification assigned to you!');
        fetchVerifications();
      }
    } catch (error) {
      console.error('Error assigning verification:', error);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      requires_additional_info: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!user?.is_staff) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Verification Review Dashboard</h1>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded ${
                filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Pending Reviews
            </button>
            <button
              onClick={() => setFilter('low_quality')}
              className={`px-4 py-2 rounded ${
                filter === 'low_quality' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              Low Quality Documents
            </button>
            <button
              onClick={() => setFilter('my_assignments')}
              className={`px-4 py-2 rounded ${
                filter === 'my_assignments' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              My Assignments
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              All Verifications
            </button>
          </div>
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : verifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No verifications found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div key={verification.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {verification.user.email}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${getStatusBadge(
                          verification.overall_status
                        )}`}
                      >
                        {verification.overall_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">University:</p>
                        <p className="font-medium">{verification.university}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Student ID:</p>
                        <p className="font-medium">{verification.student_id_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">OCR Confidence:</p>
                        <p className="font-medium">{verification.ocr_confidence}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Verification Score:</p>
                        <p className="font-medium">{verification.verification_score}/100</p>
                      </div>
                    </div>

                    {verification.extracted_student_id && (
                      <div className="mt-3 p-3 bg-blue-50 rounded">
                        <p className="text-sm text-gray-600">Extracted from Document:</p>
                        <p className="font-medium">
                          Student ID: {verification.extracted_student_id}
                        </p>
                        {verification.extracted_university && (
                          <p className="font-medium">
                            University: {verification.extracted_university}
                          </p>
                        )}
                      </div>
                    )}

                    {verification.agent_notes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">Notes:</p>
                        <p className="text-sm whitespace-pre-wrap">{verification.agent_notes}</p>
                      </div>
                    )}
                  </div>

                  {verification.document_url && (
                    <div className="ml-4">
                      <img
                        src={verification.document_url}
                        alt="Student ID"
                        className="w-48 h-32 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(verification.document_url, '_blank')}
                      />
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  {!verification.assigned_agent && (
                    <button
                      onClick={() => assignToMe(verification.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Assign to Me
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedVerification(verification)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Review
                  </button>

                  {verification.document_url && (
                    <a
                      href={verification.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      View Document
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Review Verification</h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600">User:</p>
                <p className="font-medium">{selectedVerification.user.email}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Notes (required for reject/reupload):
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full border rounded p-2 h-32"
                  placeholder="Add notes about your decision..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(selectedVerification.id, 'approve')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(selectedVerification.id, 'request_reupload')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  Request Re-upload
                </button>
                <button
                  onClick={() => handleAction(selectedVerification.id, 'reject')}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedVerification(null);
                  setActionNotes('');
                }}
                className="mt-4 w-full px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
