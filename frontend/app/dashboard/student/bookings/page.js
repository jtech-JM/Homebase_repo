'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StudentBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await fetch(`${NEXT_PUBLIC_API_URL}/api/bookings/`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500 mb-4">You don't have any active bookings.</p>
          <Link
            href="/dashboard/student/search"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
          >
            Find Accommodation
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start">
                  <img
                    src={booking.property.image || "/placeholder.png"}
                    alt=""
                    className="h-24 w-24 rounded-md object-cover"
                  />
                  <div className="ml-6 flex-1">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold">{booking.property.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        booking.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-gray-500 mt-1">{booking.property.address}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Lease Period: {new Date(booking.startDate).toLocaleDateString()} - 
                          {new Date(booking.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Monthly Rent: ${booking.monthlyRent}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/student/bookings/${booking.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {booking.nextPayment && (
                <div className="px-6 py-3 bg-blue-50 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-blue-600">Next Payment Due:</span>
                      <span className="ml-2 font-medium">
                        ${booking.nextPayment.amount} on {
                          new Date(booking.nextPayment.dueDate).toLocaleDateString()
                        }
                      </span>
                    </div>
                    <Link
                      href={`/dashboard/student/payments`}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Make Payment →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}