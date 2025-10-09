import React from "react";

export default function StudentDashboard({ user }) {
  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Profile Section */}
      <section className="flex items-center gap-4 mb-6">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt="Profile"
          className="w-16 h-16 rounded-full border"
        />
        <div>
          <h2 className="text-xl font-semibold">{user.name}</h2>
          <span className={`px-2 py-1 rounded text-xs ${user.verified ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-600"}`}>
            {user.verified ? "Verified" : "Unverified"}
          </span>
        </div>
        <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit Profile</button>
      </section>

      {/* Search & Recommendations */}
      <section className="mb-6">
        <input
          type="text"
          placeholder="Search housing by location, price, amenities..."
          className="w-full px-4 py-2 border rounded"
        />
        {/* Recommended listings would be rendered here */}
      </section>

      {/* My Applications / Bookings */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">My Applications & Bookings</h3>
        {/* List of bookings/applications */}
        <div className="bg-white rounded shadow p-4">No bookings yet.</div>
      </section>

      {/* Messages & Notifications */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Messages & Notifications</h3>
        <div className="bg-white rounded shadow p-4">No messages yet.</div>
      </section>

      {/* Financial Overview */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Financial Overview</h3>
        <div className="bg-white rounded shadow p-4">No payments due.</div>
      </section>

      {/* Community & Support */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Community & Support</h3>
        <div className="bg-white rounded shadow p-4">No community posts yet.</div>
      </section>

      {/* Trust & Safety */}
      <section>
        <h3 className="font-semibold mb-2">Trust & Safety</h3>
        <div className="bg-white rounded shadow p-4 flex items-center gap-2">
          <span>Verification badge progress:</span>
          <span className={`px-2 py-1 rounded text-xs ${user.verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
            {user.verified ? "Complete" : "Incomplete"}
          </span>
          <button className="ml-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Complete Verification</button>
        </div>
      </section>
    </div>
  );
}
