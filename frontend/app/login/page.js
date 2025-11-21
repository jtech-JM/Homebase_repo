"use client";
import LoginForm from "../../components/LoginForm";
import Link from "next/link";
import { Home, GraduationCap, Shield, TrendingUp } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex">
      {/* Left Side - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 p-12 flex-col justify-between relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-white group">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-extrabold bg-gradient-to-r from-white to-teal-200 text-transparent bg-clip-text">
              HomeBase
            </span>
          </Link>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
              Welcome Back to Your
              <span className="block text-teal-300">Student Housing Hub</span>
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Access thousands of verified student accommodations across Kenya. Your perfect home is just a click away.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <div className="w-10 h-10 bg-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Verified Listings</h3>
                <p className="text-blue-100 text-sm">All properties are verified for quality and safety</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <div className="w-10 h-10 bg-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Student-Focused</h3>
                <p className="text-blue-100 text-sm">Designed specifically for student needs and budgets</p>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
              <div className="w-10 h-10 bg-teal-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Quick & Easy</h3>
                <p className="text-blue-100 text-sm">Streamlined booking process from search to move-in</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">10k+</div>
            <div className="text-blue-200 text-sm">Students</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">5k+</div>
            <div className="text-blue-200 text-sm">Properties</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-1">50+</div>
            <div className="text-blue-200 text-sm">Universities</div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 text-transparent bg-clip-text">
                HomeBase
              </span>
            </Link>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
