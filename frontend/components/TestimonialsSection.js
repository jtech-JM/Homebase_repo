"use client";
import { useState, useEffect } from "react";

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback testimonials
  const fallbackTestimonials = [
    {
      id: 1,
      user: { first_name: "John", last_name: "Doe", email: "john@example.com" },
      rating: 5,
      comment: "HomeBase made finding accommodation so easy! The verification process gave me peace of mind.",
      university: "University of Nairobi",
    },
    {
      id: 2,
      user: { first_name: "Sarah", last_name: "Maina", email: "sarah@example.com" },
      rating: 5,
      comment: "The booking process was seamless and the property was exactly as described. Highly recommended!",
      university: "Kenyatta University",
    },
    {
      id: 3,
      user: { first_name: "Michael", last_name: "Kiprop", email: "michael@example.com" },
      rating: 5,
      comment: "Great platform with excellent support. Found my perfect room within days of arriving in the city.",
      university: "Moi University",
    },
  ];

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/testimonials/featured/`
      );
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data.length > 0 ? data.slice(0, 3) : fallbackTestimonials);
      } else {
        setTestimonials(fallbackTestimonials);
      }
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      setTestimonials(fallbackTestimonials);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (user) => {
    if (!user) return "??";
    const first = user.first_name?.[0] || user.email?.[0] || "?";
    const last = user.last_name?.[0] || "";
    return (first + last).toUpperCase();
  };

  const getFullName = (user) => {
    if (!user) return "Anonymous";
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.first_name || user.email?.split("@")[0] || "Anonymous";
  };

  const renderStars = (rating) => {
    return (
      <div className="flex text-yellow-400 mb-2" aria-label={`${rating} out of 5 stars`}>
        {[...Array(5)].map((_, i) => (
          <span key={i} aria-hidden="true">
            {i < rating ? "★" : "☆"}
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section className="py-20" aria-label="Student testimonials">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">What Our Students Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-lg animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20" aria-label="Student testimonials">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Students Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="bg-white p-6 rounded-lg shadow-lg"
              itemScope
              itemType="https://schema.org/Review"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold">
                    {getInitials(testimonial.user)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold" itemProp="author">
                    {getFullName(testimonial.user)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.university || "Student"}
                  </div>
                </div>
              </div>
              <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                <meta itemProp="ratingValue" content={testimonial.rating} />
                <meta itemProp="bestRating" content="5" />
                {renderStars(testimonial.rating)}
              </div>
              <p className="text-gray-600" itemProp="reviewBody">
                "{testimonial.comment}"
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
