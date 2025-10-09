"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">HomeBase</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {!session ? (
              <>
                <Link href="/login" className="text-gray-700 hover:text-blue-600">
                  Sign In
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Dashboard
                </Link>
                {session.user?.role === "admin" && (
                  <Link href="/admin" className="text-gray-700 hover:text-blue-600">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}