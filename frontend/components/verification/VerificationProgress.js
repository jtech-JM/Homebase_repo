'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import VerificationBadge from './VerificationBadge';

/**
 * VerificationProgress Component
 * 
 * Shows user's verification progress with milestones and next steps.
 */
export default function VerificationProgress({
  showMilestones = true,
  showNextSteps = true,
  compact = false,
}) {
  const { data: session } = useSession();
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/my-status/`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVerificationData(data);
        }
      } catch (error) {
        console.error('Error fetching verification status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVerificationStatus();
  }, [session]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!verificationData) {
    return null;
  }

  const { score = 0, level = 'unverified', methods = [] } = verificationData;

  const milestones = [
    {
      score: 31,
      level: 'basic',
      title: 'Basic Verified',
      icon: '📧',
      benefits: ['Community access', 'Make bookings', 'Contact landlords'],
      completed: score >= 31,
    },
    {
      score: 70,
      level: 'verified',
      title: 'Verified Student',
      icon: '✓',
      benefits: ['Student discounts', 'Priority booking', 'Peer verification'],
      completed: score >= 70,
    },
    {
      score: 100,
      level: 'premium',
      title: 'Fully Verified',
      icon: '⭐',
      benefits: ['Maximum discounts', 'Premium features', 'Exclusive listings'],
      completed: score >= 100,
    },
  ];

  const nextMilestone = milestones.find(m => !m.completed);
  const pointsToNext = nextMilestone ? nextMilestone.score - score : 0;

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm text-gray-600 mb-1">Verification Status</div>
            <VerificationBadge score={score} level={level} size="medium" />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{score}%</div>
            {nextMilestone && (
              <div className="text-xs text-gray-600">
                {pointsToNext} to {nextMilestone.title}
              </div>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Verification Progress
          </h3>
          <VerificationBadge score={score} level={level} size="medium" showScore />
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{score}%</div>
          <div className="text-sm text-gray-600">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%` }}
          />
        </div>
        {nextMilestone && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            {pointsToNext} points to reach {nextMilestone.title}
          </div>
        )}
      </div>

      {/* Milestones */}
      {showMilestones && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Milestones</h4>
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 transition-all ${
                  milestone.completed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{milestone.icon}</span>
                    <span className="font-semibold text-gray-900">
                      {milestone.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {milestone.score}%
                    </span>
                    {milestone.completed && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {milestone.benefits.join(' • ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {showNextSteps && score < 100 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Next Steps</h4>
          <div className="space-y-2">
            {!methods.includes('university_email') && (
              <Link
                href="/verification"
                className="block p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Verify University Email
                    </div>
                    <div className="text-sm text-gray-600">+30 points</div>
                  </div>
                  <span className="text-blue-600">→</span>
                </div>
              </Link>
            )}
            {!methods.includes('student_id') && methods.includes('university_email') && (
              <Link
                href="/verification"
                className="block p-3 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">
                      Upload Student ID
                    </div>
                    <div className="text-sm text-gray-600">+40 points</div>
                  </div>
                  <span className="text-blue-600">→</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Celebration for 100% */}
      {score >= 100 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="font-semibold text-gray-900 mb-1">
            Fully Verified!
          </div>
          <div className="text-sm text-gray-600">
            You have access to all features and maximum benefits
          </div>
        </div>
      )}
    </div>
  );
}
