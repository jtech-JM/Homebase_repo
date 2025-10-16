"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../page';

export default function StudentPaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed

  useEffect(() => {
    if (session) {
      fetchPayments();
      fetchUpcomingPayments();
    }
  }, [session, filter]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/student/?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpcomingPayments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/student/upcoming/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch upcoming payments');
      const data = await response.json();
      setUpcomingPayments(data);
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
    }
  };

  const handlePayment = async (paymentId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/pay/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to process payment');
      fetchPayments();
      fetchUpcomingPayments();
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={studentSidebarItems}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Payments</h1>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        {/* Upcoming Payments */}
        {upcomingPayments.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Upcoming Payments</h2>
            <div className="space-y-4">
              {upcomingPayments.map((payment) => (
                <div key={payment.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{payment.property?.title || 'Property Payment'}</h3>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Amount: ${payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePayment(payment.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment History */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Payment History</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {payments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No payments found
                </div>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium">{payment.listing?.title || 'Property Payment'}</span>
                          <span className={`px-2 py-1 text-xs rounded-full
                            ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">
                          Date: {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Type: {payment.payment_type || 'Rent Payment'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium mb-2">${payment.amount.toLocaleString()}</div>
                        {payment.status === 'pending' && (
                          <button
                            onClick={() => handlePayment(payment.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
