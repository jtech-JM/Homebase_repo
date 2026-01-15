"use client";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import { useState, useEffect } from "react";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) {
    // Dashboard pages have their own layout, no nav/footer needed
    return <>{children}</>;
  }

  // For non-dashboard pages, always render the same structure
  // The Navigation component handles its own loading state
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-1 pt-20"> {/* Consistent padding */}
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-12" role="contentinfo">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">HomeBase</h3>
              <div className="text-gray-300 mb-4">
                Connecting students with quality accommodation near their campuses.
              </div>
              <nav aria-label="Social media links">
                <div className="flex space-x-4">
                  <a href="https://facebook.com/homebase" className="text-gray-300 hover:text-white transition-colors" aria-label="Visit our Facebook page">Facebook</a>
                  <a href="https://twitter.com/homebase" className="text-gray-300 hover:text-white transition-colors" aria-label="Visit our Twitter page">Twitter</a>
                  <a href="https://instagram.com/homebase" className="text-gray-300 hover:text-white transition-colors" aria-label="Visit our Instagram page">Instagram</a>
                </div>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Students</h4>
              <nav aria-label="Student resources">
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/dashboard/student/search" className="hover:text-white transition-colors">Find Housing</a></li>
                  <li><a href="/how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                  <li><a href="/safety-tips" className="hover:text-white transition-colors">Safety Tips</a></li>
                  <li><a href="/student-guide" className="hover:text-white transition-colors">Student Guide</a></li>
                </ul>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Landlords</h4>
              <nav aria-label="Landlord resources">
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/dashboard/landlord" className="hover:text-white transition-colors">List Property</a></li>
                  <li><a href="/dashboard/landlord" className="hover:text-white transition-colors">Landlord Portal</a></li>
                  <li><a href="/verification" className="hover:text-white transition-colors">Verification</a></li>
                  <li><a href="/support" className="hover:text-white transition-colors">Support</a></li>
                </ul>
              </nav>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <nav aria-label="Support links">
                <ul className="space-y-2 text-gray-300">
                  <li><a href="/help" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
                </ul>
              </nav>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; {new Date().getFullYear()} HomeBase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}