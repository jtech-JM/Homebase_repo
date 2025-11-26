'use client';

import { useState, useEffect } from 'react';

/**
 * VerificationFilterBar Component
 * 
 * Filter and sort controls for landlords to manage applications by verification status.
 */
export default function VerificationFilterBar({
  onFilterChange = null,
  onSortChange = null,
  showSummary = true,
}) {
  const [filterOptions, setFilterOptions] = useState([]);
  const [sortOptions, setSortOptions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('date_desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/landlord/sorting-options/`);
        if (response.ok) {
          const data = await response.json();
          setFilterOptions(data.filter_options || []);
          setSortOptions(data.sort_options || []);
        }
      } catch (error) {
        console.error('Error fetching options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleFilterChange = (value) => {
    setSelectedFilter(value);
    if (onFilterChange) {
      onFilterChange(value);
    }
  };

  const handleSortChange = (value) => {
    setSelectedSort(value);
    if (onSortChange) {
      onSortChange(value);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Verification
          </label>
          <select
            value={selectedFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          {filterOptions.find(o => o.value === selectedFilter)?.description && (
            <p className="text-xs text-gray-600 mt-1">
              {filterOptions.find(o => o.value === selectedFilter).description}
            </p>
          )}
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            value={selectedSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          {sortOptions.find(o => o.value === selectedSort)?.description && (
            <p className="text-xs text-gray-600 mt-1">
              {sortOptions.find(o => o.value === selectedSort).description}
            </p>
          )}
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleFilterChange('verified_only')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'verified_only'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          ✓ Verified Only
        </button>
        <button
          onClick={() => handleFilterChange('basic_plus')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'basic_plus'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📧 Basic+
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedFilter === 'all'
              ? 'bg-gray-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          👥 All
        </button>
      </div>
    </div>
  );
}
