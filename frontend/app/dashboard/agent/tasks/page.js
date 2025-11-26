"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';

const agentSidebarItems = [
  { label: 'Overview', href: '/dashboard/agent', icon: '📊' },
  { label: 'Student Support', href: '/dashboard/agent/students', icon: '👨‍🎓' },
  { label: 'Landlord Support', href: '/dashboard/agent/landlords', icon: '🏘️' },
  { label: 'Property Verification', href: '/dashboard/agent/verification', icon: '✅' },
  { label: 'Applications', href: '/dashboard/agent/applications', icon: '📝' },
  { label: 'Tasks', href: '/dashboard/agent/tasks', icon: '📋' },
  { label: 'Reports', href: '/dashboard/agent/reports', icon: '📈' },
];

export default function AgentTasks() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/agent/tasks`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        });
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      fetchTasks();
    }
  }, [session]);

  const handleTaskUpdate = async (taskId, updates) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/agent/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setTasks(prev => 
          prev.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        );
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleProtectedLayout allowedRoles={['agent']}>
      <DashboardLayout sidebarItems={agentSidebarItems}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-gray-600">Manage your assigned tasks and workflow</p>
        </div>

        {/* Filter and Stats */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              {['all', 'pending', 'in_progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                    filter === status
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              + New Task
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {tasks.filter(t => t.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending Tasks</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">
                {tasks.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {tasks.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-red-600">
                {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length}
              </div>
              <div className="text-sm text-gray-500">High Priority</div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No tasks found for the selected filter.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <div key={task.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {task.title || 'Task Title'}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                          {task.priority || 'medium'} priority
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">
                        {task.description || 'No description available'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>📅 Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                        <span>👤 Assigned by: {task.assigned_by || 'System'}</span>
                        <span>🏷️ Type: {task.task_type || 'General'}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {task.status === 'pending' && (
                        <button
                          onClick={() => handleTaskUpdate(task.id, { status: 'in_progress' })}
                          className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                        >
                          Start
                        </button>
                      )}
                      {task.status === 'in_progress' && (
                        <button
                          onClick={() => handleTaskUpdate(task.id, { status: 'completed' })}
                          className="px-3 py-1 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
                        >
                          Complete
                        </button>
                      )}
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}