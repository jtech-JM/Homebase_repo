"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import { Search, Filter, MessageSquare, Phone, Mail, Building, Clock, CheckCircle, AlertTriangle, Home, DollarSign } from 'lucide-react';

const agentSidebarItems = [
  { label: 'Overview', href: '/dashboard/agent', icon: '📊' },
  { label: 'Student Support', href: '/dashboard/agent/students', icon: '👨‍🎓' },
  { label: 'Landlord Support', href: '/dashboard/agent/landlords', icon: '🏘️' },
  { label: 'Property Verification', href: '/dashboard/agent/verification', icon: '✅' },
  { label: 'Applications', href: '/dashboard/agent/applications', icon: '📝' },
  { label: 'Tasks', href: '/dashboard/agent/tasks', icon: '📋' },
  { label: 'Reports', href: '/dashboard/agent/reports', icon: '📈' },
];

export default function LandlordSupportPage() {
  const { data: session } = useSession();
  const [landlords, setLandlords] = useState([]);
  const [onboardingRequests, setOnboardingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchLandlordData();
  }, [session]);

  const fetchLandlordData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setLandlords([
        {
          id: 1,
          name: 'Sarah Wilson',
          email: 'sarah@example.com',
          phone: '+1 234-567-8900',
          status: 'verified',
          joinDate: '2024-01-10',
          properties: 5,
          totalRevenue: 15000,
          lastContact: '2024-01-20',
          issues: 0
        },
        {
          id: 2,
          name: 'Robert Chen',
          email: 'robert@example.com',
          phone: '+1 234-567-8901',
          status: 'pending_verification',
          joinDate: '2024-01-18',
          properties: 2,
          totalRevenue: 6000,
          lastContact: '2024-01-19',
          issues: 1
        },
        {
          id: 3,
          name: 'Maria Garcia',
          email: 'maria@example.com',
          phone: '+1 234-567-8902',
          status: 'verified',
          joinDate: '2024-01-05',
          properties: 8,
          totalRevenue: 24000,
          lastContact: '2024-01-21',
          issues: 0
        }
      ]);

      setOnboardingRequests([
        {
          id: 1,
          name: 'David Thompson',
          email: 'david@example.com',
          phone: '+1 234-567-8903',
          propertyCount: 3,
          submittedDate: '2024-01-20',
          status: 'pending_review',
          documents: ['ID', 'Property Deed', 'Tax Records']
        },
        {
          id: 2,
          name: 'Lisa Anderson',
          email: 'lisa@example.com',
          phone: '+1 234-567-8904',
          propertyCount: 1,
          submittedDate: '2024-01-19',
          status: 'documents_required',
          documents: ['ID', 'Property Deed']
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching landlord data:', error);
      setLoading(false);
    }
  };

  const handleContactLandlord = (landlordId, method) => {
    console.log(`Contacting landlord ${landlordId} via ${method}`);
    // Implement contact functionality
  };

  const handleOnboardingAction = (requestId, action) => {
    console.log(`${action} onboarding request ${requestId}`);
    // Implement onboarding action functionality
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending_verification: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      suspended: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig.pending_verification;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getOnboardingStatusBadge = (status) => {
    const colors = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      documents_required: 'bg-red-100 text-red-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const filteredLandlords = landlords.filter(landlord => {
    const matchesSearch = landlord.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         landlord.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || landlord.status === statusFilter;
    
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
            <h1 className="text-3xl font-bold text-gray-900">Landlord Support</h1>
            <p className="text-gray-600 mt-1">Manage landlord accounts and onboarding process</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search landlords by name or email..."
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
              <option value="verified">Verified</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Landlords Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredLandlords.map((landlord) => (
            <div key={landlord.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{landlord.name}</h3>
                    <p className="text-sm text-gray-600">{landlord.email}</p>
                  </div>
                </div>
                {getStatusBadge(landlord.status)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Properties</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{landlord.properties}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Revenue</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">${landlord.totalRevenue.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Phone:</span>
                  <span>{landlord.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Issues:</span>
                  <span className={landlord.issues > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {landlord.issues}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Last Contact:</span>
                  <span>{landlord.lastContact}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleContactLandlord(landlord.id, 'message')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <button
                  onClick={() => handleContactLandlord(landlord.id, 'call')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button
                  onClick={() => handleContactLandlord(landlord.id, 'email')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Onboarding Requests */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Pending Onboarding Requests</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Landlord
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {onboardingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{request.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{request.email}</div>
                      <div className="text-sm text-gray-500">{request.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{request.propertyCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {request.documents.map((doc, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getOnboardingStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.submittedDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOnboardingAction(request.id, 'review')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleOnboardingAction(request.id, 'approve')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleOnboardingAction(request.id, 'reject')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}