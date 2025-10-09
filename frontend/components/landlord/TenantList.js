"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TenantList() {
  const router = useRouter();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, past

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  const fetchTenants = async () => {
    try {
      const response = await fetch(`/api/tenants?status=${filter}`);
      if (!response.ok) throw new Error('Failed to fetch tenants');
      const data = await response.json();
      setTenants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (tenantId, status) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update tenant status');
      fetchTenants();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tenants</h2>
        <div className="space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Tenants</option>
            <option value="active">Active Tenants</option>
            <option value="past">Past Tenants</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tenant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lease Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No tenants found
                </td>
              </tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {tenant.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {tenant.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {tenant.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {tenant.property.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {tenant.property.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(tenant.leaseStart).toLocaleDateString()} -
                      {new Date(tenant.leaseEnd).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${tenant.status === 'active' ? 'bg-green-100 text-green-800' : 
                      tenant.status === 'past' ? 'bg-gray-100 text-gray-800' : 
                      'bg-yellow-100 text-yellow-800'}`}
                    >
                      {tenant.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => router.push(`/dashboard/landlord/tenants/${tenant.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      View Details
                    </button>
                    {tenant.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(tenant.id, 'past')}
                        className="text-red-600 hover:text-red-900"
                      >
                        End Lease
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}