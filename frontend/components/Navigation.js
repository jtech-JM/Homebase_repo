"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navigation() {
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 backdrop-blur-lg text-white shadow-2xl border-b border-purple-500/20">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">

          {/* Logo with Icon */}
          <Link
            href="/"
            className="flex items-center space-x-3 transition-all duration-300 hover:scale-[1.02] group"
          >
            <div className="relative p-2 bg-gradient-to-br from-purple-500 to-cyan-400 rounded-xl shadow-lg">
              <HomeIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-300 text-transparent bg-clip-text tracking-tight">
                HomeBase
              </span>
              <div className="h-0.5 w-0 bg-cyan-400 group-hover:w-full transition-all duration-500 rounded-full"></div>
            </div>
          </Link>

          {/* Menu - Show loading state until mounted to prevent hydration mismatch */}
          <div className="flex items-center space-x-2">
            {!isMounted ? (
              // Loading skeleton that matches the final layout
              <div className="flex items-center space-x-2">
                <div className="w-20 h-10 bg-gray-700 rounded-xl animate-pulse"></div>
                <div className="w-32 h-10 bg-gray-700 rounded-xl animate-pulse"></div>
              </div>
            ) : !session ? (
              <>
                <AnimatedLink href="/login" icon={<LoginIcon />}>
                  Sign In
                </AnimatedLink>
                <AnimatedButton href="/register" icon={<RocketIcon />}>
                  Get Started
                </AnimatedButton>
              </>
            ) : (
              <>
                <AnimatedLink href="/dashboard" icon={<DashboardIcon />}>
                  Dashboard
                </AnimatedLink>

                {session.user?.role === "admin" && (
                  <AnimatedLink href="/admin" icon={<AdminIcon />}>
                    Admin Panel
                  </AnimatedLink>
                )}

                <button
                  onClick={() => signOut()}
                  className="group flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium 
                             text-gray-200 hover:text-white transition-all duration-300 
                             hover:bg-rose-500/20 border border-transparent hover:border-rose-400/30
                             backdrop-blur-sm"
                >
                  <LogoutIcon className="w-4 h-4" />
                  <span>Sign Out</span>
                  <div className="w-0 group-hover:w-2 transition-all duration-300">
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* Enhanced Link with Icon */
function AnimatedLink({ href, children, icon }) {
  return (
    <Link href={href}>
      <span
        className="group flex items-center space-x-2 cursor-pointer px-4 py-2.5 rounded-xl font-medium
                   text-gray-200 hover:text-white transition-all duration-300 
                   hover:bg-purple-500/20 border border-transparent hover:border-purple-400/30
                   backdrop-blur-sm"
      >
        {icon && <span className="text-cyan-300 group-hover:scale-110 transition-transform duration-300">{icon}</span>}
        <span>{children}</span>
        <div className="w-0 group-hover:w-2 transition-all duration-300">
          <ArrowRightIcon className="w-4 h-4" />
        </div>
      </span>
    </Link>
  );
}

/* Enhanced Button with Icon */
function AnimatedButton({ href, children, icon }) {
  return (
    <Link href={href}>
      <span
        className="group flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600
                   text-white font-bold shadow-lg hover:shadow-xl
                   transition-all duration-300 hover:scale-[1.02] hover:shadow-cyan-500/40
                   relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {icon && <span className="relative z-10 group-hover:scale-110 transition-transform duration-300">{icon}</span>}
        <span className="relative z-10">{children}</span>
        <div className="relative z-10 w-0 group-hover:w-2 transition-all duration-300">
          <ArrowRightIcon className="w-4 h-4" />
        </div>
      </span>
    </Link>
  );
}

/* Icons (keep the same as before) */
function HomeIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function DashboardIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AdminIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LoginIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );
}

function RocketIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function LogoutIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}