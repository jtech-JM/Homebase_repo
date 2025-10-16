"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, student, landlord, agent, admin

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session, filter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/?role=${filter}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/update_role/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update user role');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message);
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/toggle_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) throw new Error('Failed to update user status');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">User Management</h1>
          <div className="space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="landlord">Landlords</option>
              <option value="agent">Agents</option>
              <option value="admin">Admins</option>
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
            <h2 className="text-lg font-medium">Users</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {users.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No users found
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      <img
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-semibold">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-600">Role: {user.role}</p>
                        <p className="text-sm text-gray-600">
                          Joined: {new Date(user.date_joined).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="p-1 border rounded text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="landlord">Landlord</option>
                        <option value="agent">Agent</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        onClick={() => handleStatusChange(user.id, !user.is_active)}
                        className={`px-3 py-1 rounded text-sm ${
                          user.is_active
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
