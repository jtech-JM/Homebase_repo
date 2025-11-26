'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, Filter, MapPin, Home, DollarSign, Loader2, X, Star, Heart, Share2 } from 'lucide-react';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Property Card with enhanced interactivity
function PropertyCard({ property }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2">
      <div className="relative h-48 overflow-hidden">
        <div className="relative h-full w-full">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          )}
          <img
            src={property.images?.[0] || "/placeholder.png"}
            alt={property.title}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {property.isFeatured && (
            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Featured
            </span>
          )}
          {property.isNew && (
            <span className="bg-gradient-to-r from-green-400 to-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              New
            </span>
          )}
        </div>

        {/* Price */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-lg font-bold text-blue-600 shadow-xl border border-white/20">
          KSh {property.price?.toLocaleString()}
        </div>

        {/* Like button */}
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-sm border border-white/20 transition-all duration-300 ${
            isLiked 
              ? 'bg-red-500/90 text-white shadow-lg' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-xl text-gray-900 line-clamp-1 flex-1 mr-2">
            {property.title}
          </h3>
          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm line-clamp-1">{property.address}</p>
        </div>

        {/* Rating and features */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((star) => (
              <Star 
                key={star}
                className={`w-4 h-4 ${
                  star <= (property.rating || 0) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-sm text-gray-500 ml-1">({property.reviews || 0})</span>
          </div>
          
          {property.furnished && (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
              Furnished
            </span>
          )}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs text-gray-600">
          {property.bedrooms && (
            <div className="flex items-center gap-1">
              <Home className="w-3 h-3" />
              <span>{property.bedrooms} bed</span>
            </div>
          )}
          {property.bathrooms && (
            <div className="flex items-center gap-1">
              <span>🚿</span>
              <span>{property.bathrooms} bath</span>
            </div>
          )}
          {property.area && (
            <div className="flex items-center gap-1">
              <span>📐</span>
              <span>{property.area} sqft</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500 font-medium">/month</span>
          <Link
            href={`/dashboard/student/listing/${property.id}`}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// Filter Section Component
function FilterSection({ filters, setFilters, onClose }) {
  const amenities = ['WiFi', 'Parking', 'Gym', 'Pool', 'Security', 'Water', 'Electricity'];
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'studio', label: 'Studio' },
    { value: 'shared', label: 'Shared Room' },
    { value: 'hostel', label: 'Hostel' }
  ];

  const toggleAmenity = (amenity) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Price Range (KSh)</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-2">Minimum</label>
                <input
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-2">Maximum</label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Property Type */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Property Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {propertyTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setFilters({ ...filters, propertyType: type.value })}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                    filters.propertyType === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {amenities.map((amenity) => (
                <button
                  key={amenity}
                  onClick={() => toggleAmenity(amenity)}
                  className={`p-3 rounded-xl border-2 transition-all duration-300 flex items-center gap-2 ${
                    filters.amenities.includes(amenity)
                      ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    filters.amenities.includes(amenity) 
                      ? 'bg-green-500 border-green-500' 
                      : 'bg-white border-gray-400'
                  }`} />
                  {amenity}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Options */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Additional Options</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.furnished}
                  onChange={(e) => setFilters({ ...filters, furnished: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium">Furnished only</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="font-medium">Verified properties only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 rounded-b-3xl">
          <div className="flex gap-3">
            <button
              onClick={() => setFilters({
                priceMin: '',
                priceMax: '',
                propertyType: '',
                amenities: [],
                furnished: false,
                verifiedOnly: false
              })}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
            >
              Reset All
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentSearch() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: searchParams.get('maxPrice') || '',
    propertyType: searchParams.get('propertyType') || '',
    amenities: [],
    furnished: false,
    verifiedOnly: false
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/search/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          location: searchQuery,
          min_price: filters.priceMin || null,
          max_price: filters.priceMax || null,
          property_type: filters.propertyType || null,
          amenities: filters.amenities,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch properties');

      const data = await response.json();
      setProperties(data);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [debouncedSearchQuery, filters]);

  const activeFiltersCount = [
    filters.priceMin,
    filters.priceMax,
    filters.propertyType,
    filters.furnished,
    filters.verifiedOnly
  ].filter(Boolean).length + filters.amenities.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">
            Find Your Perfect Home
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover student accommodations that match your lifestyle and budget
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-red-700 animate-pulse">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            <div className={`flex-1 relative transition-all duration-300 ${
              searchFocus ? 'scale-105' : 'scale-100'
            }`}>
              <SearchIcon className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <input
                type="text"
                placeholder="Search by location, university, property name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                className="w-full pl-16 pr-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-200 text-lg transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-blue-500 hover:text-blue-600 font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Filter className="w-5 h-5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs min-w-6">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={fetchProperties}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 disabled:opacity-50 disabled:transform-none"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <SearchIcon className="w-6 h-6" />
              )}
              <span>{loading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {loading ? "Finding properties..." : `Available Properties`}
            </h2>
            <p className="text-gray-600 text-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching for the best matches...
                </span>
              ) : (
                `Found ${properties.length} propert${properties.length === 1 ? 'y' : 'ies'} matching your criteria`
              )}
            </p>
          </div>

          {!loading && properties.length > 0 && (
            <div className="flex items-center gap-4">
              <select className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                <option>Sort by: Recommended</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
                <option>Highest Rated</option>
              </select>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300" />
                <div className="p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No properties found</h3>
              <p className="text-gray-600 mb-8 text-lg">
                Try adjusting your search criteria or filters to find more results
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    priceMin: '',
                    priceMax: '',
                    propertyType: '',
                    amenities: [],
                    furnished: false,
                    verifiedOnly: false
                  });
                }}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl hover:from-blue-700 hover:to-cyan-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!loading && properties.length > 0 && (
          <div className="text-center mt-12">
            <button className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-blue-500 hover:text-blue-600 font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Load More Properties
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilters && (
        <FilterSection
          filters={filters}
          setFilters={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}