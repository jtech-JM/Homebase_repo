'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { landlordSidebarItems } from '../../page';
import { ArrowLeft, Edit, Trash2, Power, PowerOff, Wrench, MapPin, Bed, Bath, Home, Calendar, DollarSign, User, Phone, Mail } from 'lucide-react';

export default function ListingDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session && params.id) {
      fetchListing();
    }
  }, [session, params.id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${params.id}/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch listing');
      const data = await response.json();
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${params.id}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update listing status');
      fetchListing(); // Refresh the listing
    } catch (error) {
      console.error('Error updating listing:', error);
      setError(error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${params.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete listing');
      router.push('/dashboard/landlord/listings');
    } catch (error) {
      console.error('Error deleting listing:', error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  if (error) {
    return (
      <DashboardLayout sidebarItems={landlordSidebarItems}>
        <div className="p-6">
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!listing) {
    return (
      <DashboardLayout sidebarItems={landlordSidebarItems}>
        <div className="p-6">
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Listing not found</h3>
            <p className="text-gray-500 mb-6">The listing you're looking for doesn't exist or has been removed.</p>
            <Link
              href="/dashboard/landlord/listings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Listings
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/landlord/listings"
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Listings
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{listing.title}</h1>
              <div className="flex items-center gap-2 text-gray-600 mt-1">
                <MapPin className="w-4 h-4" />
                <span>{listing.address}</span>
                {listing.location && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span>{listing.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              listing.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
              listing.status === 'booked' ? 'bg-blue-100 text-blue-800' :
              listing.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-amber-100 text-amber-800'
            }`}>
              {listing.status === 'maintenance' && <Wrench className="w-3 h-3 inline mr-1" />}
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>

            <Link
              href={`/dashboard/landlord/listings/${listing.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit Listing
            </Link>

            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="relative">
                {listing.images && listing.images.length > 0 ? (
                  <div className="aspect-video">
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <span className="text-gray-500 text-lg">No Images Available</span>
                    </div>
                  </div>
                )}

                {listing.images && listing.images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                    +{listing.images.length - 1} more photos
                  </div>
                )}
              </div>

              {/* Additional Images Grid */}
              {listing.images && listing.images.length > 1 && (
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">All Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {listing.images.slice(1).map((image, index) => (
                      <div key={index} className="aspect-square rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`${listing.title} - Photo ${index + 2}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <Bed className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{listing.bedrooms}</div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                    <Bath className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{listing.bathrooms}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">${listing.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Per Month</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                    <Home className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 capitalize">{listing.property_type}</div>
                  <div className="text-sm text-gray-600">Type</div>
                </div>
              </div>

              {listing.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{listing.description}</p>
                </div>
              )}

              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.amenities.map((amenity, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Listing Status</h3>

              <div className="space-y-3">
                {listing.status === 'available' && (
                  <button
                    onClick={() => handleStatusChange('inactive')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
                  >
                    <PowerOff className="w-4 h-4" />
                    Deactivate Listing
                  </button>
                )}

                {listing.status === 'inactive' && (
                  <button
                    onClick={() => handleStatusChange('available')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200"
                  >
                    <Power className="w-4 h-4" />
                    Activate Listing
                  </button>
                )}

                {listing.status === 'maintenance' && (
                  <button
                    onClick={() => handleStatusChange('available')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
                  >
                    <Wrench className="w-4 h-4" />
                    Mark as Ready
                  </button>
                )}

                {listing.status !== 'maintenance' && (
                  <button
                    onClick={() => handleStatusChange('maintenance')}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200"
                  >
                    <Wrench className="w-4 h-4" />
                    Mark Under Maintenance
                  </button>
                )}
              </div>
            </div>

            {/* Landlord Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Property Owner</h3>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {listing.landlord?.first_name} {listing.landlord?.last_name}
                  </div>
                  <div className="text-sm text-gray-600">{listing.landlord?.email}</div>
                </div>
              </div>
            </div>

            {/* Listing Stats */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Listing Information</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Created
                  </span>
                  <span className="text-gray-900">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Last Updated
                  </span>
                  <span className="text-gray-900">
                    {new Date(listing.updated_at).toLocaleDateString()}
                  </span>
                </div>

                {listing.status === 'booked' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Tenant</span>
                    <span className="text-gray-900">Occupied</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
