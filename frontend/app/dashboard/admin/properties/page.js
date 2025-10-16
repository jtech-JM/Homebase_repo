"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';

export default function PropertiesPage() {
  const { data: session } = useSession();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, available, booked, inactive, pending

  useEffect(() => {
    if (session) {
      fetchProperties();
    }
  }, [session, filter]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/properties/?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch properties');
      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/properties/${propertyId}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update property status');
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error('Error updating property:', error);
      setError(error.message);
    }
  };

  const handleVerificationToggle = async (propertyId, verified) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/properties/${propertyId}/toggle_verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ verified }),
      });

      if (!response.ok) throw new Error('Failed to update property verification');
      fetchProperties(); // Refresh the list
    } catch (error) {
      console.error('Error updating property verification:', error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Property Management</h1>
          <div className="space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Properties</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Verification</option>
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
            <h2 className="text-lg font-medium">Properties</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {properties.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No properties found
              </div>
            ) : (
              properties.map((property) => (
                <div key={property.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-4">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Image</span>
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.address}</p>
                        <p className="text-sm text-gray-600">Landlord: {property.landlord?.name}</p>
                        <p className="text-sm text-gray-600">
                          Price: ${property.price.toLocaleString()}/month
                        </p>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(property.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          property.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.verified ? 'Verified' : 'Unverified'}
                        </span>
                        <button
                          onClick={() => handleVerificationToggle(property.id, !property.verified)}
                          className={`px-3 py-1 rounded text-sm ${
                            property.verified
                              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {property.verified ? 'Unverify' : 'Verify'}
                        </button>
                      </div>
                      <select
                        value={property.status}
                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        className="p-1 border rounded text-sm"
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
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
