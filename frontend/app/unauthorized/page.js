"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function UnauthorizedPage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-red-100">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          
          <p className="text-gray-600 mb-6">
            {status === "unauthenticated" 
              ? "You need to be logged in to access this page."
              : "You don't have permission to access this page. This area is restricted to authorized users only."}
          </p>

          {session?.user?.role && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Your Role:</span> {session.user.role}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {status === "unauthenticated" ? (
              <Link
                href="/login"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <LogIn className="w-5 h-5" />
                Sign In
              </Link>
            ) : (
              <Link
                href={session?.user?.role ? `/dashboard/${session.user.role}` : "/dashboard"}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Home className="w-5 h-5" />
                Go to My Dashboard
              </Link>
            )}
            
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              <Home className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          Need help? <Link href="/support" className="text-indigo-600 hover:text-indigo-700 font-medium">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}
