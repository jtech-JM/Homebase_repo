'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../../page';
import Link from 'next/link';

export default function ListingDetail() {
  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    if (session && id) {
      fetchListing();
    }
  }, [session, id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/${id}/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch listing details');
      const data = await response.json();
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setBookingLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          listing: id,
          notes: 'Application submitted via student dashboard',
        }),
      });
      if (!response.ok) throw new Error('Failed to submit application');
      alert('Application submitted successfully!');
      router.push('/dashboard/student/applications');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  if (error) {
    return (
      <DashboardLayout sidebarItems={studentSidebarItems}>
        <div className="p-6">
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
            {error}
          </div>
          <Link href="/dashboard/student/search" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Search
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!listing) return null;

  return (
    <DashboardLayout sidebarItems={studentSidebarItems}>
      <div className="p-6">
        <div className="mb-6">
          <Link href="/dashboard/student/search" className="text-blue-600 hover:underline">
            ← Back to Search
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Image Gallery */}
          <div className="relative">
            <img
              src={listing.images?.[0] || "/placeholder.png"}
              alt={listing.title}
              className="w-full h-96 object-cover"
            />
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                listing.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {listing.status_display}
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                <p className="text-gray-600 text-lg">{listing.address}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-blue-600">${listing.price}</span>
                  <span className="text-gray-500 ml-1">/month</span>
                </div>
              </div>
              <button
                onClick={handleApply}
                disabled={bookingLoading || listing.status !== 'available'}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Applying...' : 'Apply Now'}
              </button>
            </div>

            {/* Property Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{listing.bedrooms}</div>
                <div className="text-gray-600">Bedrooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{listing.bathrooms}</div>
                <div className="text-gray-600">Bathrooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{listing.square_feet || 'N/A'}</div>
                <div className="text-gray-600">Sq Ft</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{listing.property_type_display}</div>
                <div className="text-gray-600">Type</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="text-gray-700 leading-relaxed">{listing.description}</p>
            </div>

            {/* Amenities */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Amenities</h2>
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

            {/* Landlord Info */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold mb-3">Property Manager</h2>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">
                    {listing.landlord.first_name?.[0] || listing.landlord.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="font-medium">{listing.landlord.get_full_name || listing.landlord.email}</p>
                  <p className="text-gray-600">Property Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
