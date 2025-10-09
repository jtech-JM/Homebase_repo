import React from "react";

export default function AgentDashboard({ user }) {
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

      {/* Student Support */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Student Support</h3>
        <div className="bg-white rounded shadow p-4">No students assigned yet.</div>
      </section>

      {/* Landlord Support */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Landlord Support</h3>
        <div className="bg-white rounded shadow p-4">No landlords assigned yet.</div>
      </section>

      {/* Property Verification */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Property Verification</h3>
        <div className="bg-white rounded shadow p-4">No properties pending verification.</div>
      </section>

      {/* Applications & Matchmaking */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Applications & Matchmaking</h3>
        <div className="bg-white rounded shadow p-4">No applications yet.</div>
      </section>

      {/* Payments & Collections */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Payments & Collections</h3>
        <div className="bg-white rounded shadow p-4">No payment data yet.</div>
      </section>

      {/* Communication & Tasks */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Communication & Tasks</h3>
        <div className="bg-white rounded shadow p-4">No tasks assigned yet.</div>
      </section>

      {/* Escalation & Reporting */}
      <section>
        <h3 className="font-semibold mb-2">Escalation & Reporting</h3>
        <div className="bg-white rounded shadow p-4">No issues to escalate.</div>
      </section>
    </div>
  );
}
