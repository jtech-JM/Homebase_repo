'use client';
import Link from 'next/link';

export default function ListingsPage() {
  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">My Listings</h1>
        <Link 
          href="/dashboard/landlord/listings/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add New Listing
        </Link>
      </div>
      
      {/* Listings Grid will be implemented here */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Listing cards will be populated here */}
      </div>
    </div>
  );
}