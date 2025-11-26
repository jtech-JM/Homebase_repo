"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import { Search, Filter, MessageSquare, Phone, Mail, User, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const agentSidebarItems = [
  { label: 'Overview', href: '/dashboard/agent', icon: '📊' },
  { label: 'Student Support', href: '/dashboard/agent/students', icon: '👨‍🎓' },
  { label: 'Landlord Support', href: '/dashboard/agent/landlords', icon: '🏘️' },
  { label: 'Property Verification', href: '/dashboard/agent/verification', icon: '✅' },
  { label: 'Applications', href: '/dashboard/agent/applications', icon: '📝' },
  { label: 'Tasks', href: '/dashboard/agent/tasks', icon: '📋' },
  { label: 'Reports', href: '/dashboard/agent/reports', icon: '📈' },
];

export default function StudentSupportPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchStudentData();
  }, [session]);

  const fetchStudentData = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setStudents([
        {
          id: 1,
          name: 'John Doe',
          email: 'john@example.com',
          university: 'Harvard University',
          phone: '+1 234-567-8900',
          status: 'active',
          joinDate: '2024-01-15',
          issues: 2,
          lastContact: '2024-01-20'
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane@example.com',
          university: 'MIT',
          phone: '+1 234-567-8901',
          status: 'pending_verification',
          joinDate: '2024-01-18',
          issues: 0,
          lastContact: '2024-01-19'
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike@example.com',
          university: 'Stanford University',
          phone: '+1 234-567-8902',
          status: 'active',
          joinDate: '2024-01-10',
          issues: 1,
          lastContact: '2024-01-21'
        }
      ]);

      setSupportTickets([
        {
          id: 1,
          studentName: 'John Doe',
          subject: 'Unable to view property details',
          priority: 'medium',
          status: 'open',
          created: '2024-01-20',
          lastUpdate: '2024-01-20'
        },
        {
          id: 2,
          studentName: 'Mike Johnson',
          subject: 'Payment processing issue',
          priority: 'high',
          status: 'in_progress',
          created: '2024-01-19',
          lastUpdate: '2024-01-21'
        }
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  const handleContactStudent = (studentId, method) => {
    console.log(`Contacting student ${studentId} via ${method}`);
    // Implement contact functionality
  };

  const handleTicketAction = (ticketId, action) => {
    console.log(`${action} ticket ${ticketId}`);
    // Implement ticket action functionality
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending_verification: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: AlertTriangle }
    };

    const config = statusConfig[status] || statusConfig.inactive;
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

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.university.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
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
            <h1 className="text-3xl font-bold text-gray-900">Student Support</h1>
            <p className="text-gray-600 mt-1">Manage student accounts and provide support</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name, email, or university..."
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
              <option value="active">Active</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {filteredStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{student.name}</h3>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>
                {getStatusBadge(student.status)}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">University:</span>
                  <span>{student.university}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Phone:</span>
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Issues:</span>
                  <span className={student.issues > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {student.issues}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="font-medium">Last Contact:</span>
                  <span>{student.lastContact}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleContactStudent(student.id, 'message')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <button
                  onClick={() => handleContactStudent(student.id, 'call')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call
                </button>
                <button
                  onClick={() => handleContactStudent(student.id, 'email')}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Support Tickets */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-gray-900">Recent Support Tickets</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supportTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{ticket.studentName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{ticket.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ticket.status === 'open' ? 'bg-green-100 text-green-800' :
                        ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleTicketAction(ticket.id, 'view')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleTicketAction(ticket.id, 'respond')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Respond
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