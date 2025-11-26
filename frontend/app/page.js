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
  const [activeFeature, setActiveFeature] = useState(0);

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

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Verified Listings",
      description: "Every property is personally verified for your safety and comfort",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Quick Move-In",
      description: "Streamlined booking process to get you settled in faster",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      title: "24/7 Student Support",
      description: "Get help anytime from our dedicated student support team",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      title: "Campus Proximity",
      description: "Find homes within walking distance of your university",
      color: "from-orange-500 to-red-500"
    }
  ];

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
        dangerouslySetInnerHTML={{
          __html: `
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "HomeBase",
            "url": "https://yourdomain.com"
          }
          `,
        }}
      />

      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">

        {/* HERO SECTION - With Background Image */}
        <section 
          className="relative py-20 md:py-28 overflow-hidden"
          role="banner"
          aria-label="Find your perfect student home"
        >
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&w=1200&h=600&fit=crop&crop=entropy")',
            }}
          >
            {/* Dark Overlay for Better Text Readability */}
            <div className="absolute inset-0 bg-black/40"></div>
            
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 to-purple-900/30"></div>
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Main Heading with Personality */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-white">
                Your Campus
                <span className="block bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Home Awaits
                </span>
              </h1>
              
              {/* Subtitle that speaks directly to students */}
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Find verified, affordable housing that fits your student lifestyle. 
                <span className="block text-lg text-white/80 mt-2">
                  Because your focus should be on studies, not housing hassles.
                </span>
              </p>

              {/* Action Buttons - More Prominent */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <button
                  onClick={() => router.push('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold text-lg flex items-center gap-3 backdrop-blur-sm bg-white/10 border border-white/20"
                  aria-label="Start your housing search"
                >
                  Find My Home
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 border-2 border-white/30 text-white rounded-2xl hover:border-white hover:bg-white/10 transition-all duration-300 font-semibold text-lg backdrop-blur-sm"
                  aria-label="Sign in to your account"
                >
                  Sign In
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 text-white/80 text-sm">
                <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  5,000+ Happy Students
                </div>
                <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  200+ Campus Locations
                </div>
                <div className="flex items-center gap-2 backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  24/7 Support
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE FEATURES - More Engaging */}
        <section className="py-20" aria-label="Why students love HomeBase">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Designed for <span className="text-blue-600">Student Life</span>
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Everything you need to find the perfect home away from home
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group cursor-pointer"
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 transition-all duration-300 hover:shadow-xl h-full ${
                    activeFeature === index 
                      ? 'border-blue-500 transform scale-105' 
                      : 'border-transparent hover:border-slate-200'
                  }`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-800">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* POPULAR LISTINGS - More Visual & Engaging */}
        <section className="py-20 bg-white/50" aria-label="Trending student accommodations">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trending <span className="text-blue-600">Student Picks</span>
              </h2>
              <p className="text-lg text-slate-600">
                Properties loved by students across Kenya
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-label="Loading popular listings"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12" role="alert">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchPopularListings}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  aria-label="Retry loading popular listings"
                >
                  Try Again
                </button>
              </div>
            ) : popularListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-slate-100 rounded-2xl p-8 max-w-md mx-auto">
                  <p className="text-slate-600 mb-4">No listings available at the moment.</p>
                  <p className="text-sm text-slate-500">Check back soon for new student accommodations!</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {popularListings.map((listing) => (
                  <article
                    key={listing.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group"
                    itemScope
                    itemType="https://schema.org/Accommodation"
                  >
                    {/* Image with Overlay */}
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden relative">
                      {listing.images && listing.images.length > 0 ? (
                        <Image
                          src={listing.images[0]}
                          alt={`${listing.title} - Student accommodation`}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white">
                          <svg className="w-16 h-16 mb-2 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-sm font-semibold">Student Home</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-slate-700">
                        ⭐ 4.8
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors" itemProp="name">
                          {listing.title}
                        </h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Available
                        </span>
                      </div>

                      <p className="text-slate-600 mb-4 text-sm leading-relaxed" itemProp="description">
                        {listing.description ? listing.description.slice(0, 120) + (listing.description.length > 120 ? "..." : "") : "Perfect student accommodation near campus"}
                      </p>

                      <div className="flex items-center text-slate-500 text-sm mb-4" itemProp="address">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {listing.address}
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-2xl font-bold text-blue-600" itemProp="priceRange">
                            KSh {listing.price?.toLocaleString() || listing.price}
                          </span>
                          <span className="text-slate-500 text-sm block">per month</span>
                        </div>
                        <button
                          onClick={() => router.push(`/dashboard/student/listing/${listing.id}`)}
                          className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 px-4 py-2 rounded-lg transition-all duration-300 font-semibold text-sm group-hover:scale-105"
                          aria-label={`View details for ${listing.title}`}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Browse All CTA */}
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/generalsearch')}
                className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-xl transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
                aria-label="Browse all available properties"
              >
                Explore All Properties
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* LAZY LOADED SECTIONS */}
        <Suspense fallback={
          <div className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 text-center">
              <div className="animate-pulse text-slate-600">Loading statistics...</div>
            </div>
          </div>
        }>
          <StatisticsSection />
        </Suspense>

        <Suspense fallback={
          <div className="py-20">
            <div className="container mx-auto px-4 text-center">
              <div className="animate-pulse text-slate-600">Loading testimonials...</div>
            </div>
          </div>
        }>
          <TestimonialsSection />
        </Suspense>

        {/* FINAL CTA - More Personal */}
        <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white" aria-label="Start your housing journey">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of students who've found their perfect home through HomeBase
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => router.push('/register')}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg"
                aria-label="Create your account and start searching"
              >
                🎓 Start My Search
              </button>
              
              <button
                onClick={() => router.push('/login')}
                className="border-2 border-white text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300"
                aria-label="Sign in to continue your search"
              >
                Welcome Back
              </button>
            </div>
            
            <p className="mt-8 text-blue-200 text-sm">
              ✨ Find your home in minutes, not months
            </p>
          </div>
        </section>

      </main>
    </>
  );
}