'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../../page';
import Link from 'next/link';

export default function BookingDetail() {
  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (session && id) {
      fetchBooking();
    }
  }, [session, id]);

  const fetchBooking = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch booking details');
      const data = await response.json();
      setBooking(data);
    } catch (error) {
      console.error('Error fetching booking:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancelLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/${id}/update_status/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!response.ok) throw new Error('Failed to cancel booking');
      setBooking({ ...booking, status: 'cancelled' });
    } catch (error) {
      console.error('Error canceling booking:', error);
      setError(error.message);
    } finally {
      setCancelLoading(false);
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
          <Link href="/dashboard/student/bookings" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Bookings
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) return null;

  return (
    <DashboardLayout sidebarItems={studentSidebarItems}>
      <div className="p-6">
        <div className="mb-6">
          <Link href="/dashboard/student/bookings" className="text-blue-600 hover:underline">
            ← Back to Bookings
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-start">
              <img
                src={booking.listing.image || "/placeholder.png"}
                alt=""
                className="h-32 w-32 rounded-md object-cover"
              />
              <div className="ml-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-semibold">{booking.listing.title}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    booking.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : booking.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status_display}
                  </span>
                </div>
                <p className="text-gray-500 mb-4">{booking.listing.address}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Booking Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Lease Period:</span> {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                      <p><span className="font-medium">Monthly Rent:</span> ${booking.monthly_rent}</p>
                      <p><span className="font-medium">Security Deposit:</span> ${booking.security_deposit}</p>
                      <p><span className="font-medium">Created:</span> {new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Property Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Type:</span> {booking.listing.property_type_display}</p>
                      <p><span className="font-medium">Bedrooms:</span> {booking.listing.bedrooms}</p>
                      <p><span className="font-medium">Bathrooms:</span> {booking.listing.bathrooms}</p>
                      {booking.listing.square_feet && <p><span className="font-medium">Square Feet:</span> {booking.listing.square_feet}</p>}
                    </div>
                  </div>
                </div>

                {booking.notes && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{booking.notes}</p>
                  </div>
                )}

                <div className="mt-6 flex space-x-4">
                  {booking.status === 'pending' && (
                    <button
                      onClick={handleCancelBooking}
                      disabled={cancelLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {cancelLoading ? 'Canceling...' : 'Cancel Booking'}
                    </button>
                  )}
                  <Link
                    href={`/dashboard/student/payments`}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Payments
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
