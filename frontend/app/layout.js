import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "../components/Navigation";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HomeBase - Student Housing Platform",
  description: "Find your perfect student accommodation near campus. Verified listings, secure booking, and 24/7 support.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Navigation />
          {children}
          <footer className="bg-gray-800 text-white py-12">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">HomeBase</h3>
                  <p className="text-gray-300 mb-4">
                    Connecting students with quality accommodation near their campuses.
                  </p>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-300 hover:text-white">Facebook</a>
                    <a href="#" className="text-gray-300 hover:text-white">Twitter</a>
                    <a href="#" className="text-gray-300 hover:text-white">Instagram</a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">For Students</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><a href="#" className="hover:text-white">Find Housing</a></li>
                    <li><a href="#" className="hover:text-white">How It Works</a></li>
                    <li><a href="#" className="hover:text-white">Safety Tips</a></li>
                    <li><a href="#" className="hover:text-white">Student Guide</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">For Landlords</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><a href="#" className="hover:text-white">List Property</a></li>
                    <li><a href="#" className="hover:text-white">Landlord Portal</a></li>
                    <li><a href="#" className="hover:text-white">Verification</a></li>
                    <li><a href="#" className="hover:text-white">Support</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">Support</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li><a href="#" className="hover:text-white">Help Center</a></li>
                    <li><a href="#" className="hover:text-white">Contact Us</a></li>
                    <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
                <p>&copy; 2024 HomeBase. All rights reserved.</p>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
