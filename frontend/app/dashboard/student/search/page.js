'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../page';
import Link from 'next/link';
import { Search as SearchIcon, Filter, MapPin, Home, DollarSign, Loader2 } from 'lucide-react';
import { 
  VerificationGate, 
  VerificationBadge,
  VerificationPrompt,
  FeatureLock,
  ExpirationWarning
} from '@/components/verification';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Property Card Component
function PropertyCard({ property, verificationScore }) {
  const hasDiscount = verificationScore >= 70;
  const discountedPrice = hasDiscount ? property.price * 0.9 : property.price;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="relative h-48 overflow-hidden">
        <img
          src={property.images?.[0] || "/placeholder.png"}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
          <div className="bg-white px-3 py-1 rounded-full text-sm font-semibold text-blue-600 shadow-md">
            {hasDiscount && (
              <span className="line-through text-gray-400 mr-2">
                KSh {property.price?.toLocaleString()}
              </span>
            )}
            KSh {discountedPrice?.toLocaleString()}
          </div>
          {hasDiscount && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold shadow-md">
              10% Student Discount
            </div>
          )}
        </div>
        {property.isPremium && (
          <div className="absolute top-3 left-3">
            <VerificationBadge score={verificationScore} size="sm" />
          </div>
        )}
      </div>
      <div className="p-6">
        <h3 className="font-semibold text-lg mb-2 text-gray-900 line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm line-clamp-1">{property.address}</p>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">/month</span>
          <Link
            href={`/dashboard/student/listing/${property.id}`}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudentSearch() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: searchParams.get('maxPrice') || '',
    propertyType: searchParams.get('propertyType') || '',
    amenities: [],
    furnished: false,
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verificationScore, setVerificationScore] = useState(0);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchProperties = async () => {
    try {
      // Fetch verification status
      const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/my-status/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        setVerificationScore(verificationData.score || 0);
      }

      // Fetch properties
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          location: searchQuery, // Use search query as location filter
          min_price: filters.priceMin || null,
          max_price: filters.priceMax || null,
          property_type: filters.propertyType || null,
          amenities: filters.amenities,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch properties');

      const data = await response.json();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchProperties();
    }
  }, [debouncedSearchQuery, filters, session]);

  return (
    <DashboardLayout sidebarItems={studentSidebarItems}>
      <div>
        {/* Expiration Warning */}
        <div className="mb-6">
          <ExpirationWarning />
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Properties</h1>
          <p className="text-gray-600">Find your perfect student accommodation</p>
        </div>

        {/* Verification Status Banner */}
        {verificationScore < 70 && (
          <div className="mb-6">
            <VerificationPrompt
              title="Unlock Student Discounts"
              message="Complete your verification to access exclusive student rates and premium properties."
              requiredScore={70}
              currentScore={verificationScore}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg flex items-start gap-3">
              <div className="text-red-600">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by location, university, or property name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              />
            </div>
            <button
              onClick={fetchProperties}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <SearchIcon className="w-5 h-5" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (KSh)</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.priceMin}
                    onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.priceMax}
                    onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <div className="relative">
                <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={filters.propertyType}
                  onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                >
                  <option value="">All Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="studio">Studio</option>
                  <option value="shared">Shared Room</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.furnished}
                  onChange={(e) => setFilters({...filters, furnished: e.target.checked})}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Furnished Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            {loading ? 'Searching...' : `Found ${properties.length} ${properties.length === 1 ? 'property' : 'properties'}`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-8 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilters({
                  priceMin: '',
                  priceMax: '',
                  propertyType: '',
                  amenities: [],
                  furnished: false,
                });
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => {
              const isPremium = property.isPremium || property.price > 50000;
              const requiresVerification = isPremium && verificationScore < 70;

              return (
                <div key={property.id}>
                  {requiresVerification ? (
                    <VerificationGate
                      requiredScore={70}
                      feature="premium_properties"
                      fallback={
                        <FeatureLock
                          feature="Premium Property"
                          requiredScore={70}
                          currentScore={verificationScore}
                          benefits={[
                            "Access to premium properties",
                            "Student discount rates",
                            "Priority booking"
                          ]}
                        />
                      }
                    >
                      <PropertyCard property={property} verificationScore={verificationScore} />
                    </VerificationGate>
                  ) : (
                    <PropertyCard property={property} verificationScore={verificationScore} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}