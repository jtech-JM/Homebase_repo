"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ChooseRolePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!session) {
    return <p className="text-center mt-10">Please log in first.</p>;
  }

  const handleSubmit = async () => {
    if (!selectedRole) {
      setError("Please select a role before continuing.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${session.user.id}/set_role/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`, // JWT from NextAuth
          },
          body: JSON.stringify({ role: selectedRole }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to set role");
      }

      // Redirect to dashboard after setting role
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6 text-center">Choose Your Role</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {["student", "landlord", "agent"].map((role) => (
          <label
            key={role}
            className={`block p-3 border rounded cursor-pointer ${
              selectedRole === role
                ? "bg-blue-100 border-blue-500"
                : "hover:bg-gray-50"
            }`}
          >
            <input
              type="radio"
              name="role"
              value={role}
              checked={selectedRole === role}
              onChange={() => setSelectedRole(role)}
              className="mr-2"
            />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </label>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}
