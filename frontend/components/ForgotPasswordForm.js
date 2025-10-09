"use client";
import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users/reset_password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to send recovery email");
      setMessage("Password recovery instructions sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 animate-fade-in" onSubmit={handleSubmit}>
      <h1 className="text-2xl font-bold text-center mb-6 text-blue-700 tracking-tight">Forgot Password?</h1>
      <label className="block mb-2 font-medium">Enter your email address</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-2 border rounded mb-4"
        required
      />
      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold" disabled={loading}>
        {loading ? "Sending..." : "Send Recovery Email"}
      </button>
      {message && <div className="text-green-600 mt-4 text-center">{message}</div>}
      {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
    </form>
  );
}
