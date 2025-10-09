import React from "react";

export default function AdminDashboard({ user }) {
  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Overview Section */}
      <section className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Admin Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <div className="text-lg font-semibold">Total Students</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="bg-green-100 p-4 rounded shadow text-center">
            <div className="text-lg font-semibold">Total Landlords</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="bg-yellow-100 p-4 rounded shadow text-center">
            <div className="text-lg font-semibold">Active Listings</div>
            <div className="text-2xl font-bold">0</div>
          </div>
          <div className="bg-pink-100 p-4 rounded shadow text-center">
            <div className="text-lg font-semibold">Applications Pending</div>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>
      </section>

      {/* User Management */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">User Management</h3>
        <div className="bg-white rounded shadow p-4">No users to manage yet.</div>
      </section>

      {/* Property Management */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Property Management</h3>
        <div className="bg-white rounded shadow p-4">No properties to manage yet.</div>
      </section>

      {/* Applications & Bookings */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Applications & Bookings</h3>
        <div className="bg-white rounded shadow p-4">No applications yet.</div>
      </section>

      {/* Payments & Finance */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Payments & Finance</h3>
        <div className="bg-white rounded shadow p-4">No payment data yet.</div>
      </section>

      {/* Reports & Analytics */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Reports & Analytics</h3>
        <div className="bg-white rounded shadow p-4">No reports yet.</div>
      </section>

      {/* Support & Communication */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Support & Communication</h3>
        <div className="bg-white rounded shadow p-4">No support tickets yet.</div>
      </section>

      {/* System Settings */}
      <section>
        <h3 className="font-semibold mb-2">System Settings</h3>
        <div className="bg-white rounded shadow p-4">No settings available yet.</div>
      </section>
    </div>
  );
}
