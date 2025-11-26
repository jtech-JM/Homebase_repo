 "use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

const amenitiesList = [
  "WiFi", "Parking", "Furnished", "Security", "Laundry",
  "Kitchen", "Air Conditioning", "Heating", "Study Area", "Common Room"
];

export default function PropertyForm({ property = null }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({
    title: property?.title || "",
    description: property?.description || "",
    address: property?.address || "",
    location: property?.address || "",
    price: property?.price || "",
    amenities: property?.amenities || [],
    property_type: property?.property_type || "apartment",
    bedrooms: property?.bedrooms || 1,
    bathrooms: property?.bathrooms || 1,
    square_feet: property?.square_feet || "",
    available_from: property?.available_from || "",
    lease_term: property?.lease_term || "12-months",
    status: property?.status || "available"
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setImages(prevImages => [...prevImages, ...files]);
  };

  const handleAmenityToggle = (amenity) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (key === 'amenities') {
          formData.append(key, JSON.stringify(form[key]));
        } else {
          formData.append(key, form[key]);
        }
      });
      
      images.forEach(image => {
        formData.append('images[]', image);
      });

      const url = property
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/listings/${property.id}/`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/listings/`;

      const response = await fetch(url, {
        method: property ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to save property');

      router.push('/dashboard/landlord/listings');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Property Title</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 h-32"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Price (per month)</label>
            <input
              type="number"
              value={form.price}
              onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Property Type</label>
            <select
              value={form.property_type}
              onChange={e => setForm(prev => ({ ...prev, property_type: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="studio">Studio</option>
              <option value="shared">Shared Room</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={form.address}
              onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full address (street, city, state, zip)"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(prev => ({ ...prev, location: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Enter location (e.g., Downtown, Near University)"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bedrooms</label>
            <input
              type="number"
              value={form.bedrooms}
              onChange={e => setForm(prev => ({ ...prev, bedrooms: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Bathrooms</label>
            <input
              type="number"
              value={form.bathrooms}
              onChange={e => setForm(prev => ({ ...prev, bathrooms: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Square Feet</label>
            <input
              type="number"
              value={form.square_feet}
              onChange={e => setForm(prev => ({ ...prev, square_feet: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Lease Term (months)</label>
            <select
              value={form.lease_term}
              onChange={e => setForm(prev => ({ ...prev, lease_term: e.target.value }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="6-months">6 months</option>
              <option value="12-months">12 months</option>
              <option value="24-months">24 months</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amenities</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {amenitiesList.map(amenity => (
              <label key={amenity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={form.amenities.includes(amenity)}
                  onChange={() => handleAmenityToggle(amenity)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Property Images</label>
          <input
            type="file"
            onChange={handleImageUpload}
            multiple
            accept="image/*"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Property ${index + 1}`}
                  className="w-full h-24 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : (property ? 'Update Property' : 'Create Property')}
        </button>
      </div>
    </form>
  );
}