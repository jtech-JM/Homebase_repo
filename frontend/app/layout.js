import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import ConditionalLayout from "../components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "HomeBase - Student Housing Platform | Find Verified Accommodation Near Campus",
  description: "Find your perfect student accommodation near campus in Kenya. Browse 5,000+ verified listings, secure booking, and 24/7 support. Trusted by 10,000+ students across 50+ universities.",
  keywords: "student housing, student accommodation, university housing, campus housing, Kenya student rentals, verified listings, affordable housing",
  authors: [{ name: "HomeBase" }],
  openGraph: {
    title: "HomeBase - Student Housing Platform",
    description: "Find your perfect student accommodation near campus. Verified listings, secure booking, and 24/7 support.",
    type: "website",
    locale: "en_KE",
    siteName: "HomeBase",
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeBase - Student Housing Platform",
    description: "Find your perfect student accommodation near campus. Verified listings, secure booking, and 24/7 support.",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <ConditionalLayout>{children}</ConditionalLayout>
        </Providers>
      </body>
    </html>
  );
}
