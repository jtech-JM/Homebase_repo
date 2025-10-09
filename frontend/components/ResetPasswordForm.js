"use client"
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/reset_password_confirm/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password: password }),
      });
      if (!res.ok) throw new Error("Failed to reset password");
      setMessage("Password reset successful. You can now log in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 animate-fade-in" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-700 tracking-tight">Reset Password</h1>
      <label className="block mb-2 font-medium">New Password</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        required
      />
      <label className="block mb-2 font-medium">Confirm New Password</label>
      <input
        type="password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        required
      />
      <button type="submit" className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
      {message && <div className="text-green-600 mt-4 text-center">{message}</div>}
      {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
    </form>
  );
}
