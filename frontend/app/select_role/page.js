"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SelectRole() {
  const { data: session, status, update } = useSession();
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    if (session.user?.role !== "pending") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/update_role/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `JWT ${session.accessToken}`,
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        // Update session with new role
        await update({ role });
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update role");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-4">Select Your Role</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-2 font-medium">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="student">Student</option>
            <option value="landlord">Landlord</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
          disabled={loading}
        >
          {loading ? "Updating..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
