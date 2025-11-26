"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';
import { Home, CheckCircle, XCircle, AlertTriangle, Search, Filter, MoreVertical, Eye, Edit, MapPin, DollarSign } from 'lucide-react';

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

    if (!session || loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 bg-opacity-70 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Management</h1>
          <p className="text-gray-600 mt-1">Oversee and manage all property listings on the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Properties</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Properties Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Properties</h2>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {properties.length} properties
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {properties.length === 0 ? (
            <div className="p-12 text-center">
              <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            properties.map((property) => (
              <div key={property.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {property.images && property.images.length > 0 ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          className="w-20 h-20 rounded-lg object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                          <Home className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white ${
                        property.verified ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{property.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">{property.address}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            ${property.price.toLocaleString()}/month
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          Landlord: {property.landlord?.name || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Created: {new Date(property.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {property.verified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            Unverified
                          </span>
                        )}
                        <button
                          onClick={() => handleVerificationToggle(property.id, !property.verified)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            property.verified
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          }`}
                        >
                          {property.verified ? (
                            <>
                              <XCircle className="w-4 h-4" />
                              Unverify
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Verify
                            </>
                          )}
                        </button>
                      </div>

                      <select
                        value={property.status}
                        onChange={(e) => handleStatusChange(property.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${
                          property.status === 'available'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : property.status === 'booked'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : property.status === 'inactive'
                            ? 'bg-gray-50 text-gray-700 border-gray-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="inactive">Inactive</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>

                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
