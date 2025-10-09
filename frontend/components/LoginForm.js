
"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import SocialLoginButtons from "./SocialLoginButtons";

export default function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [socialLoading, setSocialLoading] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
    setError(""); // Clear error when user types
  };

  const handleSocialLogin = async (provider) => {
    try {
      setSocialLoading(provider);
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(`Failed to sign in with ${provider}. Please try again.`);
      } else if (result?.ok) {
        // Let the dashboard handle the role-based routing
        router.push("/dashboard");
        router.refresh(); // Ensure session is updated
      }
    } catch (err) {
      setError(`An error occurred while signing in with ${provider}.`);
    } finally {
      setSocialLoading("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError(result.error === "CredentialsSignin" ? "Invalid email or password" : result.error);
      } else if (result?.ok) {
        router.push("/dashboard");
        router.refresh(); // Ensure session is updated
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  return (
    <form className="bg-white p-8 rounded shadow-md w-full max-w-md" onSubmit={handleLogin}>
      <h2 className="text-xl font-bold mb-4">Sign In</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded animate-shake">
          {error}
        </div>
      )}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-2 font-medium">Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
          minLength={8}
        />
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="remember"
            id="remember"
            checked={form.remember}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="remember" className="text-sm text-gray-600">Remember me</label>
        </div>
        <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Forgot Password?
        </a>
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
        disabled={loading || socialLoading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner />
            Signing in...
          </span>
        ) : (
          'Sign In'
        )}
      </button>
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex flex-col gap-2 my-4">
            <button
              type="button"
              className="w-full py-2 bg-red-500 text-white rounded flex items-center justify-center"
              onClick={() => handleSocialLogin("google")}
              disabled={loading || socialLoading}
            >
              {socialLoading === "google" ? <LoadingSpinner /> : null}
              Sign in with Google
            </button>
            <button
              type="button"
              className="w-full py-2 bg-blue-800 text-white rounded flex items-center justify-center"
              onClick={() => handleSocialLogin("facebook")}
              disabled={loading || socialLoading}
            >
              {socialLoading === "facebook" ? <LoadingSpinner /> : null}
              Sign in with Facebook
            </button>
            <button
              type="button"
              className="w-full py-2 bg-gray-800 text-white rounded flex items-center justify-center"
              onClick={() => handleSocialLogin("github")}
              disabled={loading || socialLoading}
            >
              {socialLoading === "github" ? <LoadingSpinner /> : null}
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          Create one
        </a>
      </div>
    </form>
  );
}
