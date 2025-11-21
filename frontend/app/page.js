"use client";
import { useState, useEffect, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Lazy load heavy sections
const TestimonialsSection = lazy(() => import("../components/TestimonialsSection"));
const StatisticsSection = lazy(() => import("../components/StatisticsSection"));

export default function HomePage() {
  const router = useRouter();
  const [popularListings, setPopularListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchForm, setSearchForm] = useState({
    location: "",
    propertyType: "",
    maxPrice: "",
  });

  useEffect(() => {
    fetchPopularListings();
  }, []);

  const fetchPopularListings = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/listings/popular/`
      );
      if (response.ok) {
        const data = await response.json();
        setPopularListings(data.slice(0, 3));
      } else {
        setError("Failed to load popular listings");
      }
    } catch (err) {
      console.error("Error fetching popular listings:", err);
      setError("Failed to load popular listings");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchForm.location) params.append("location", searchForm.location);
    if (searchForm.propertyType) params.append("propertyType", searchForm.propertyType);
    if (searchForm.maxPrice) params.append("maxPrice", searchForm.maxPrice);
    router.push(`/dashboard/student/search?${params.toString()}`);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HomeBase",
    "description": "Student housing platform connecting students with verified accommodation near campus",
    "url": typeof window !== 'undefined' ? window.location.origin : "https://homebase.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${typeof window !== 'undefined' ? window.location.origin : "https://homebase.com"}/dashboard/student/search?location={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-slate-50 text-slate-900">

        {/* HERO */}
        <section 
          className="bg-gradient-to-br from-indigo-700 via-blue-700 to-indigo-900 text-white py-24 animate-fadeIn"
          role="banner"
          aria-label="Hero section"
        >
          <div className="container mx-auto px-4 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 drop-shadow-lg animate-slideDown">
              Find Your Perfect <span className="text-teal-300">Student Housing</span>
            </h1>
            <p className="text-xl mb-10 max-w-2xl animate-fadeInSlow">
              Connecting students with safe, verified and affordable accommodation near campus.
            </p>

            <div className="flex gap-4 justify-center md:justify-start">
              <a
                href="/register"
                className="px-8 py-3 bg-white text-indigo-700 rounded-xl shadow-lg hover:bg-indigo-50 transition-all hover:scale-[1.03]"
                aria-label="Get started with HomeBase"
              >
                Get Started
              </a>
              <a
                href="/login"
                className="px-8 py-3 border border-white text-white rounded-xl hover:bg-white/20 transition-all hover:scale-[1.03]"
                aria-label="Sign in to your account"
              >
                Sign In
              </a>
            </div>
          </div>
        </section>

        {/* SEARCH BAR */}
        <section className="py-14 bg-white animate-fadeInUp" aria-label="Property search">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
              <h2 className="text-3xl font-bold text-center mb-6">Find Your Ideal Accommodation</h2>

              <form onSubmit={handleSearchSubmit} className="space-y-6" role="search">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

                  <div>
                    <label htmlFor="location" className="text-sm font-semibold text-slate-600 mb-1 block">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      placeholder="Enter university or city"
                      value={searchForm.location}
                      onChange={(e) => setSearchForm({ ...searchForm, location: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      aria-label="Search by location"
                    />
                  </div>

                  <div>
                    <label htmlFor="propertyType" className="text-sm font-semibold text-slate-600 mb-1 block">
                      Property Type
                    </label>
                    <select
                      id="propertyType"
                      value={searchForm.propertyType}
                      onChange={(e) => setSearchForm({ ...searchForm, propertyType: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      aria-label="Select property type"
                    >
                      <option value="">All Types</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="studio">Studio</option>
                      <option value="shared">Shared Room</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="maxPrice" className="text-sm font-semibold text-slate-600 mb-1 block">
                      Max Price
                    </label>
                    <input
                      id="maxPrice"
                      type="number"
                      placeholder="Monthly rent"
                      value={searchForm.maxPrice}
                      onChange={(e) => setSearchForm({ ...searchForm, maxPrice: e.target.value })}
                      className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      aria-label="Maximum monthly price"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl shadow-md font-semibold transition-all hover:scale-[1.03]"
                      aria-label="Search for properties"
                    >
                      Search Properties
                    </button>
                  </div>

                </div>
              </form>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20" aria-label="Platform features">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose HomeBase?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <article className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Verified checkmark icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Verified Listings</h3>
                <p className="text-gray-600">All properties are verified to ensure quality and safety.</p>
              </article>

              <article className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Clock icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Quick Booking</h3>
                <p className="text-gray-600">Streamlined process from search to move-in.</p>
              </article>

              <article className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-label="Support chat icon">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
                <p className="text-gray-600">Dedicated support team for all your needs.</p>
              </article>
            </div>
          </div>
        </section>

        {/* POPULAR LISTINGS */}
        <section className="py-20 bg-gray-50" aria-label="Popular listings">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Popular Student Accommodations</h2>
            <p className="text-center text-gray-600 mb-12">Discover trending properties loved by students across Kenya</p>

            {loading ? (
              <div className="flex justify-center items-center py-12" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" aria-label="Loading popular listings"></div>
                <span className="sr-only">Loading popular listings...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12" role="alert">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchPopularListings}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                  aria-label="Retry loading popular listings"
                >
                  Try Again
                </button>
              </div>
            ) : popularListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No listings available at the moment. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {popularListings.map((listing) => (
                  <article
                    key={listing.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                    itemScope
                    itemType="https://schema.org/Accommodation"
                  >
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                      {listing.images && listing.images.length > 0 ? (
                        <Image
                          src={listing.images[0]}
                          alt={`${listing.title} - Student accommodation`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                          className="object-cover transform transition-transform duration-500 hover:scale-[1.05]"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-gray-500 text-sm font-semibold">Property Image</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2" itemProp="name">{listing.title}</h3>
                      <p className="text-gray-600 mb-3" itemProp="description">
                        {listing.description ? listing.description.slice(0, 100) + (listing.description.length > 100 ? "..." : "") : "Comfortable student accommodation"}
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-indigo-600" itemProp="priceRange">
                          KSh {listing.price?.toLocaleString() || listing.price}/month
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Available Now</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500 mb-4" itemProp="address">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.address}
                      </div>

                      <a
                        href={`/dashboard/student/listing/${listing.id}`}
                        className="w-full block bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 text-center"
                        aria-label={`View details for ${listing.title}`}
                      >
                        View Details
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="text-center mt-8">
              <a 
                href="/dashboard/student/search" 
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-semibold"
                aria-label="Browse all available properties"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse All Properties
              </a>
            </div>
          </div>
        </section>

        {/* STATISTICS - Lazy loaded */}
        <Suspense fallback={
          <div className="py-20 bg-gray-50">
            <div className="container mx-auto px-4 text-center">
              <div className="animate-pulse">Loading statistics...</div>
            </div>
          </div>
        }>
          <StatisticsSection />
        </Suspense>

        {/* TESTIMONIALS - Lazy loaded */}
        <Suspense fallback={
          <div className="py-20">
            <div className="container mx-auto px-4 text-center">
              <div className="animate-pulse">Loading testimonials...</div>
            </div>
          </div>
        }>
          <TestimonialsSection />
        </Suspense>

        {/* CALL TO ACTION */}
        <section className="py-20 bg-indigo-600 text-white" aria-label="Call to action">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Home?</h2>
            <p className="text-xl mb-8">Join thousands of students who have found their perfect accommodation through HomeBase</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/register" 
                className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                aria-label="Register to start your search"
              >
                Start Your Search
              </a>
              <a 
                href="/login" 
                className="border border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors"
                aria-label="Sign in to continue"
              >
                Sign In to Continue
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
