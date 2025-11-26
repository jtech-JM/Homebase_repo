"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, AlertTriangle, FileText, Image, MapPin } from 'lucide-react';

const agentSidebarItems = [
  { label: 'Overview', href: '/dashboard/agent', icon: '📊' },
  { label: 'Student Support', href: '/dashboard/agent/students', icon: '👨‍🎓' },
  { label: 'Landlord Support', href: '/dashboard/agent/landlords', icon: '🏘️' },
  { label: 'Property Verification', href: '/dashboard/agent/verification', icon: '✅' },
  { label: 'Applications', href: '/dashboard/agent/applications', icon: '📝' },
  { label: 'Tasks', href: '/dashboard/agent/tasks', icon: '📋' },
  { label: 'Reports', href: '/dashboard/agent/reports', icon: '📈' },
];

export default function PropertyVerificationPage() {
  const { data: session } = useSession();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState(null);

  useEffect(() => {
    fetchVerificationData();
  }, [session]);

  const fetchVerificationData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setVerifications([
        {
          id: 1,
          propertyTitle: 'Modern Studio Apartment',
          propertyAddress: '123 Main St, Boston, MA',
          landlordName: 'Sarah Wilson',
          landlordEmail: 'sarah@example.com',
          submittedDate: '2024-01-20',
          status: 'pending_review',
          priority: 'high',
          documents: [
            { type: 'Property Deed', status: 'submitted', url: '/docs/deed1.pdf' },
            { type: 'Safety Certificate', status: 'submitted', url: '/docs/safety1.pdf' },
            { type: 'Photos', status: 'submitted', url: '/docs/photos1.zip' }
          ],
          notes: 'Initial submission for new property listing',
          estimatedValue: 2500,
          propertyType: 'Studio'
        },
        {
          id: 2,
          propertyTitle: '2BR Apartment Near Campus',
          propertyAddress: '456 College Ave, Cambridge, MA',
          landlordName: 'Robert Chen',
          landlordEmail: 'robert@example.com',
          submittedDate: '2024-01-19',
          status: 'documents_required',
          priority: 'medium',
          documents: [
            { type: 'Property Deed', status: 'submitted', url: '/docs/deed2.pdf' },
            { type: 'Safety Certificate', status: 'missing', url: null },
            { type: 'Photos', status: 'submitted', url: '/docs/photos2.zip' }
          ],
          notes: 'Missing safety certificate - requested from landlord',
          estimatedValue: 3200,
          propertyType: '2 Bedroom'
        },
        {
          id: 3,
          propertyTitle: 'Luxury 1BR with Amenities',
          propertyAddress: '789 Park St, Boston, MA',
          landlordName: 'Maria Garcia',
          landlordEmail: 'maria@example.com',
          submittedDate: '2024-01-18',
          status: 'approved',
          priority: 'low',
          documents: [
            { type: 'Property Deed', status: 'approved', url: '/docs/deed3.pdf' },
            { type: 'Safety Certificate', status: 'approved', url: '/docs/safety3.pdf' },
            { type: 'Photos', status: 'approved', url: '/docs/photos3.zip' }
          ],
          notes: 'All documents verified and approved',
          estimatedValue: 2800,
          propertyType: '1 Bedroom'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching verification data:', error);
      setLoading(false);
    }
  };

  const handleVerificationAction = async (verificationId, action, notes = '') => {
    try {
      // Mock API call - replace with actual implementation
      console.log(`${action} verification ${verificationId}`, notes);
      
      setVerifications(prev => 
        prev.map(verification => 
          verification.id === verificationId 
            ? { ...verification, status: action, notes: notes || verification.notes }
            : verification
        )
      );
    } catch (error) {
      console.error('Error updating verification:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      documents_required: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  const getDocumentStatusIcon = (status) => {
    switch (status) {
      case 'submitted': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'missing': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredVerifications = verifications.filter(verification => {
    const matchesSearch = verification.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verification.landlordName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || verification.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <RoleProtectedLayout allowedRoles={['agent']}>
        <DashboardLayout sidebarItems={agentSidebarItems}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </RoleProtectedLayout>
    );
  }

  return (
    <RoleProtectedLayout allowedRoles={['agent']}>
      <DashboardLayout sidebarItems={agentSidebarItems}>
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Verification</h1>
            <p className="text-gray-600 mt-1">Review and verify property listings and documentation</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by property title, address, or landlord..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="documents_required">Documents Required</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Verification Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVerifications.map((verification) => (
            <div key={verification.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{verification.propertyTitle}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{verification.propertyAddress}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(verification.status)}
                  {getPriorityBadge(verification.priority)}
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Landlord:</span>
                  <span className="font-medium">{verification.landlordName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{verification.propertyType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Est. Value:</span>
                  <span className="font-medium">${verification.estimatedValue}/month</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="font-medium">{verification.submittedDate}</span>
                </div>
              </div>

              {/* Documents Status */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Documents</h4>
                <div className="space-y-2">
                  {verification.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {getDocumentStatusIcon(doc.status)}
                        <span>{doc.type}</span>
                      </div>
                      {doc.url && (
                        <button className="text-blue-600 hover:text-blue-800">
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {verification.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">{verification.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {verification.status === 'pending_review' && (
                  <>
                    <button
                      onClick={() => handleVerificationAction(verification.id, 'approved')}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerificationAction(verification.id, 'rejected')}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                {verification.status === 'documents_required' && (
                  <button
                    onClick={() => handleVerificationAction(verification.id, 'pending_review')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Mark Complete
                  </button>
                )}
                <button
                  onClick={() => setSelectedVerification(verification)}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Details Modal */}
        {selectedVerification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Verification Details</h2>
                  <button
                    onClick={() => setSelectedVerification(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{selectedVerification.propertyTitle}</h3>
                    <p className="text-gray-600">{selectedVerification.propertyAddress}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Landlord</label>
                      <p className="text-sm">{selectedVerification.landlordName}</p>
                      <p className="text-sm text-gray-500">{selectedVerification.landlordEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      {getStatusBadge(selectedVerification.status)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
                    <div className="space-y-2">
                      {selectedVerification.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {getDocumentStatusIcon(doc.status)}
                            <span>{doc.type}</span>
                          </div>
                          <div className="flex gap-2">
                            {doc.url && (
                              <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                View
                              </button>
                            )}
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {doc.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="4"
                      defaultValue={selectedVerification.notes}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleVerificationAction(selectedVerification.id, 'approved');
                        setSelectedVerification(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        handleVerificationAction(selectedVerification.id, 'rejected');
                        setSelectedVerification(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => setSelectedVerification(null)}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}