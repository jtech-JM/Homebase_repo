'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { landlordSidebarItems } from '../page';
import { Eye, Edit, Trash2, Power, PowerOff, Wrench, Search, Plus } from 'lucide-react';

export default function ListingsPage() {
  const { data: session } = useSession();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, available, booked, inactive

  useEffect(() => {
    if (session) {
      fetchListings();
    }
  }, [session, filter]);

  const fetchListings = async () => {
    try {
      const status = filter === 'all' ? '' : `?status=${filter}`;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${status}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingId}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update listing status');
      fetchListings(); // Refresh the list
    } catch (error) {
      console.error('Error updating listing:', error);
      setError(error.message);
    }
  };

  const handleDelete = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${listingId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete listing');
      fetchListings(); // Refresh the list
    } catch (error) {
      console.error('Error deleting listing:', error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">My Listings</h1>
          <Link
            href="/dashboard/landlord/properties/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            Add New Listing
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Listings</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
              <option value="inactive">Inactive</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Plus className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first property listing</p>
                <Link
                  href="/dashboard/landlord/properties/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Listing
                </Link>
              </div>
            </div>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="relative">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Eye className="w-6 h-6 text-gray-500" />
                        </div>
                        <span className="text-gray-500 text-sm">No Image</span>
                      </div>
                    </div>
                  )}
                  {listing.images && listing.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      +{listing.images.length - 1} more
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      listing.status === 'available' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      listing.status === 'booked' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      listing.status === 'inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {listing.status === 'maintenance' && <Wrench className="w-3 h-3 inline mr-1" />}
                      {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 flex items-start gap-1">
                    <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {listing.address}
                  </p>
                  <p className="text-emerald-600 font-bold text-lg mb-3">
                    ${listing.price.toLocaleString()}/month
                  </p>
                  <div className="text-sm text-gray-500 mb-4 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-xs text-blue-600 font-medium">{listing.bedrooms}</span>
                      </div>
                      bed
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-xs text-blue-600 font-medium">{listing.bathrooms}</span>
                      </div>
                      bath
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="capitalize">{listing.property_type}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <Link
                      href={`/dashboard/landlord/listings/${listing.id}`}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Link>
                    <div className="flex space-x-1">
                      <Link
                        href={`/dashboard/landlord/listings/${listing.id}/edit`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors text-xs font-medium"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {listing.status === 'available' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'inactive')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                    >
                      <PowerOff className="w-4 h-4" />
                      Deactivate Listing
                    </button>
                  )}

                  {listing.status === 'inactive' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'available')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                    >
                      <Power className="w-4 h-4" />
                      Activate Listing
                    </button>
                  )}

                  {listing.status === 'maintenance' && (
                    <button
                      onClick={() => handleStatusChange(listing.id, 'available')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                    >
                      <Wrench className="w-4 h-4" />
                      Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
