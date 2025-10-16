"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { landlordSidebarItems } from '../page';

export default function PaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [dateRange, setDateRange] = useState('month'); // month, quarter, year

  useEffect(() => {
    if (session) {
      fetchPayments();
    }
  }, [session, filter, dateRange]);

  const fetchPayments = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/transactions/?status=${filter}&range=${dateRange}`, {
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

  const handlePaymentAction = async (paymentId, action) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/${paymentId}/${action}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`Failed to ${action} payment`);
      fetchPayments();
    } catch (error) {
      console.error(`Error ${action}ing payment:`, error);
      setError(error.message);
    }
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={landlordSidebarItems}>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">Payments</h1>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div className="space-x-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="space-x-2">
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
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Payment Transactions</h2>
          </div>
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
                        <span className="font-medium">{payment.listing?.title || 'N/A'}</span>
                        <span className={`px-2 py-1 text-xs rounded-full
                          ${payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        Tenant: {payment.student?.name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-500 mb-1">
                        Date: {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Type: {payment.payment_type || 'Payment'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium mb-2">${payment.amount.toLocaleString()}</div>
                      {payment.status === 'pending' && (
                        <div className="space-x-2">
                          <button
                            onClick={() => handlePaymentAction(payment.id, 'approve')}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handlePaymentAction(payment.id, 'reject')}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
