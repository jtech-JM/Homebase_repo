"use client";
import { useState, useEffect } from "react";

export default function StatisticsSection() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalProperties: 0,
    totalUniversities: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/statistics/`
      );
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Fallback to default values if API fails
        setStats({
          totalStudents: 10000,
          totalProperties: 5000,
          totalUniversities: 50,
          averageRating: 4.8,
        });
      }
    } catch (err) {
      console.error("Error fetching statistics:", err);
      // Use fallback values
      setStats({
        totalStudents: 10000,
        totalProperties: 5000,
        totalUniversities: 50,
        averageRating: 4.8,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k+`;
    }
    return `${num}+`;
  };

  return (
    <section className="py-20 bg-gray-50" aria-label="Platform statistics">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Trusted by Students Nationwide</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2" aria-label={`${stats.totalStudents} happy students`}>
              {loading ? "..." : formatNumber(stats.totalStudents)}
            </div>
            <div className="text-gray-600">Happy Students</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2" aria-label={`${stats.totalProperties} verified properties`}>
              {loading ? "..." : formatNumber(stats.totalProperties)}
            </div>
            <div className="text-gray-600">Verified Properties</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2" aria-label={`${stats.totalUniversities} universities`}>
              {loading ? "..." : `${stats.totalUniversities}+`}
            </div>
            <div className="text-gray-600">Universities</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-indigo-600 mb-2" aria-label={`${stats.averageRating} out of 5 average rating`}>
              {loading ? "..." : `${stats.averageRating}/5`}
            </div>
            <div className="text-gray-600">Average Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
