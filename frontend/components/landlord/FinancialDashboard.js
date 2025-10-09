"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinancialDashboard() {
  const router = useRouter();
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
    fetchFinancialData();
  }, [filter, dateRange]);

  const fetchFinancialData = async () => {
    try {
      const [financialsRes, transactionsRes] = await Promise.all([
        fetch(`/api/landlord/financials?range=${dateRange}`),
        fetch(`/api/landlord/transactions?status=${filter}&range=${dateRange}`)
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

  if (loading) return <div className="text-center p-4">Loading...</div>;

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

      {/* Monthly Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Statistics</h3>
        <div className="h-64">
          {/* Add Chart.js or other charting library implementation here */}
          <div className="grid grid-cols-12 gap-2 h-full items-end">
            {financials.monthlyStats.map((stat, index) => (
              <div
                key={index}
                className="bg-blue-500 rounded-t"
                style={{ height: `${(stat.amount / Math.max(...financials.monthlyStats.map(s => s.amount))) * 100}%` }}
              >
                <div className="text-xs text-center mt-2 transform -rotate-90">
                  ${stat.amount}
                </div>
              </div>
            ))}
          </div>
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
                      <span className="font-medium">{transaction.property.title}</span>
                      <span className={`px-2 py-1 text-xs rounded-full 
                        ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Tenant: {transaction.tenant.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Date: {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">${transaction.amount.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{transaction.type}</div>
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