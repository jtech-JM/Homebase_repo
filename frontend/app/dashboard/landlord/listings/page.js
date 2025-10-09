'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { landlordSidebarItems } from '../page';

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
          <h1 className="text-2xl font-semibold">My Listings</h1>
          <Link
            href="/dashboard/landlord/properties/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add New Listing
          </Link>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="all">All Listings</option>
            <option value="available">Available</option>
            <option value="booked">Booked</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Under Maintenance</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No listings found</p>
              <Link
                href="/dashboard/landlord/properties/new"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Your First Listing
              </Link>
            </div>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="relative">
                  {listing.images && listing.images.length > 0 ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      listing.status === 'available' ? 'bg-green-100 text-green-800' :
                      listing.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                      listing.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {listing.status}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{listing.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{listing.address}</p>
                  <p className="text-blue-600 font-semibold mb-2">
                    ${listing.price.toLocaleString()}/month
                  </p>
                  <div className="text-sm text-gray-500 mb-3">
                    {listing.bedrooms} bed • {listing.bathrooms} bath • {listing.property_type}
                  </div>

                  <div className="flex justify-between items-center">
                    <Link
                      href={`/dashboard/landlord/listings/${listing.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/landlord/listings/${listing.id}/edit`}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {listing.status === 'available' && (
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(listing.id, 'inactive')}
                        className="flex-1 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                      >
                        Deactivate
                      </button>
                    </div>
                  )}

                  {listing.status === 'inactive' && (
                    <div className="mt-3 flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(listing.id, 'available')}
                        className="flex-1 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                      >
                        Activate
                      </button>
                    </div>
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
