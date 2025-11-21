"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navigation() {
  const { data: session } = useSession();

  return (
    <nav className="bg-[#0F172A]/95 backdrop-blur-md text-gray-200 shadow-xl border-b border-slate-800">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center transition-transform duration-300 hover:scale-[1.03]"
          >
            <span className="text-2xl font-extrabold bg-gradient-to-r from-teal-300 to-blue-400 text-transparent bg-clip-text drop-shadow">
              HomeBase
            </span>
          </Link>

          {/* Menu */}
          <div className="flex items-center space-x-6">

            {!session ? (
              <>
                <AnimatedLink href="/login">Sign In</AnimatedLink>

                <AnimatedButton href="/register">Get Started</AnimatedButton>
              </>
            ) : (
              <>
                <AnimatedLink href="/dashboard">Dashboard</AnimatedLink>

                {session.user?.role === "admin" && (
                  <AnimatedLink href="/admin">Admin Panel</AnimatedLink>
                )}

                <button
                  onClick={() => signOut()}
                  className="relative group text-slate-200 hover:text-red-400 transition font-medium
                             px-3 py-1 rounded-md"
                >
                  Sign Out
                  <span className="absolute inset-x-2 -bottom-0.5 h-[2px] bg-red-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded"></span>
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}

/* Reusable link with underline + hover lift effect */
function AnimatedLink({ href, children }) {
  return (
    <Link href={href}>
      <span
        className="relative group cursor-pointer px-3 py-1 rounded-md text-slate-200
                   transition-all duration-300 hover:text-teal-300 hover:-translate-y-0.5
                   inline-block"
      >
        {children}
        <span
          className="absolute left-2 right-2 -bottom-0.5 h-[2px] bg-gradient-to-r from-teal-300 to-blue-400 
                     scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded"
        ></span>
      </span>
    </Link>
  );
}

/* Gradient button with glow + hover lift */
function AnimatedButton({ href, children }) {
  return (
    <Link href={href}>
      <span
        className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-teal-500
                   text-white font-medium shadow-lg hover:shadow-teal-500/30
                   transition-all duration-300 hover:-translate-y-0.5 hover:opacity-90"
      >
        {children}
      </span>
    </Link>
  );
}
