"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function FinancialDashboard() {
  const { data: session } = useSession();
  const [financials, setFinancials] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidPayments: 0,
    monthlyStats: [],
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const [dateRange, setDateRange] = useState("month"); // month, quarter, year

  useEffect(() => {
    if (session) {
      fetchFinancialData();
    }
  }, [session, filter, dateRange]);

  const fetchFinancialData = async () => {
    try {
      const [financialsRes, transactionsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/financials/?range=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/transactions/?status=${filter}&range=${dateRange}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        })
      ]);

      if (!financialsRes.ok || !transactionsRes.ok) {
        throw new Error('Failed to fetch financial data');
      }

      const [financialsData, transactionsData] = await Promise.all([
        financialsRes.json(),
        transactionsRes.json()
      ]);

      setFinancials(financialsData);
      setTransactions(transactionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: financials.monthlyStats.map(stat => stat.month),
    datasets: [
      {
        label: 'Revenue',
        data: financials.monthlyStats.map(stat => stat.amount),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Revenue',
      },
    },
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Overview</h2>
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
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Revenue</h3>
          <p className="text-3xl font-bold text-green-600">
            ${financials.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Payments</h3>
          <p className="text-3xl font-bold text-yellow-600">
            ${financials.pendingPayments.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Paid Payments</h3>
          <p className="text-3xl font-bold text-blue-600">
            ${financials.paidPayments.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Monthly Statistics Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Statistics</h3>
        <div className="h-64">
          {financials.monthlyStats.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No data available for the selected period
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="all">All Transactions</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{transaction.listing?.title || 'N/A'}</span>
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Tenant: {transaction.student?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">${transaction.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{transaction.payment_type || 'Payment'}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
