'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { studentSidebarItems } from '../page';
import Link from 'next/link';

export default function StudentSearch() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceMin: '',
    priceMax: '',
    propertyType: '',
    amenities: [],
    furnished: false,
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchProperties();
    }
  }, [session]);

  const fetchProperties = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/listings/search/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          query: searchQuery,
          filters,
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

  return (
    <DashboardLayout sidebarItems={studentSidebarItems}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-4">Search Properties</h1>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by location, university, or property name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-3 border rounded-lg"
            />
            <button
              onClick={fetchProperties}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Price Range</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceMin}
                  onChange={(e) => setFilters({...filters, priceMin: e.target.value})}
                  className="w-full p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceMax}
                  onChange={(e) => setFilters({...filters, priceMax: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="w-full p-2 border rounded"
              >
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="studio">Studio</option>
                <option value="shared">Shared Room</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Furnished</label>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={filters.furnished}
                  onChange={(e) => setFilters({...filters, furnished: e.target.checked})}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Furnished Only</span>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden">
                <img
                  src={property.images?.[0] || "/placeholder.png"}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
                  <p className="text-gray-600 mb-2">{property.address}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">${property.price}/mo</span>
                    <Link
                      href={`/dashboard/student/property/${property.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {properties.length === 0 && (
              <div className="col-span-full text-center p-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">No properties found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}