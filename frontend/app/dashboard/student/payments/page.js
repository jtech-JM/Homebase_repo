"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../page';
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle, Receipt, TrendingUp, Filter } from 'lucide-react';
import { 
  VerificationBadge,
  VerificationPrompt,
  ExpirationWarning
} from '@/components/verification';

export default function StudentPaymentsPage() {
  const { data: session } = useSession();
  const [payments, setPayments] = useState([]);
  const [upcomingPayments, setUpcomingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [verificationScore, setVerificationScore] = useState(0);

  useEffect(() => {
    if (session) {
      fetchPayments();
      fetchUpcomingPayments();
    }
  }, [session, filter]);

  const fetchPayments = async () => {
    try {
      // Fetch verification status
      const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/my-status/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        setVerificationScore(verificationData.score || 0);
      }

      // Fetch payments
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
      {/* Expiration Warning */}
      <div className="mb-6">
        <ExpirationWarning />
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">Payment Center</h1>
            <VerificationBadge score={verificationScore} size="md" />
          </div>
          <p className="text-gray-600 mt-1">Manage your rent payments and view payment history</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Discount Banner */}
      {verificationScore >= 70 && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-green-900">Student Discount Active</p>
              <p className="text-sm text-green-700">You're receiving 10% off on all payments with your verified student status!</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Prompt for Discounts */}
      {verificationScore < 70 && verificationScore >= 30 && (
        <div className="mb-6">
          <VerificationPrompt
            title="Unlock Student Payment Discounts"
            message="Complete your verification to receive 10% off on all rent payments."
            requiredScore={70}
            currentScore={verificationScore}
          />
        </div>
      )}

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

      {/* Upcoming Payments */}
      {upcomingPayments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Payments</h2>
            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
              {upcomingPayments.length} due
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingPayments.map((payment) => (
              <div key={payment.id} className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{payment.property?.title || 'Property Payment'}</h3>
                      <p className="text-sm text-amber-700">
                        Due: {new Date(payment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      ${payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePayment(payment.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Receipt className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {payments.length} payments
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {payments.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-500">Your payment history will appear here once you make payments.</p>
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="p-6 hover:bg-gray-50 transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      payment.status === 'completed' ? 'bg-emerald-100' :
                      payment.status === 'pending' ? 'bg-amber-100' : 'bg-red-100'
                    }`}>
                      {payment.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : payment.status === 'pending' ? (
                        <Clock className="w-6 h-6 text-amber-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{payment.listing?.title || 'Property Payment'}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          payment.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'completed' ? <CheckCircle className="w-3 h-3" /> :
                           payment.status === 'pending' ? <Clock className="w-3 h-3" /> :
                           <AlertTriangle className="w-3 h-3" />}
                          {payment.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {payment.payment_type || 'Rent Payment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        {verificationScore >= 70 && payment.discount_applied && (
                          <span className="text-sm text-gray-500 line-through">
                            ${(payment.amount / 0.9).toFixed(2)}
                          </span>
                        )}
                        <div className="text-xl font-bold text-gray-900">
                          ${payment.amount.toLocaleString()}
                        </div>
                      </div>
                      {verificationScore >= 70 && payment.discount_applied && (
                        <div className="text-xs text-green-600 font-medium mt-1">
                          10% Student Discount Applied
                        </div>
                      )}
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handlePayment(payment.id)}
                          className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay Now
                        </button>
                      )}
                    </div>
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
