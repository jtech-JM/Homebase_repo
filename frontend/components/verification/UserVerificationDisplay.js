'use client';

import { useEffect, useState } from 'react';
import VerificationBadge from './VerificationBadge';

/**
 * UserVerificationDisplay Component
 * 
 * Displays verification status for a user in profiles, listings, etc.
 */
export default function UserVerificationDisplay({
  userId,
  userName = 'User',
  showScore = false,
  showDetails = false,
  compact = false,
  inline = false,
}) {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVerification = async () => {
      try {
        const response = await fetch(`/api/verification/badge/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setVerificationData(data);
        }
      } catch (error) {
        console.error('Error fetching verification:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchVerification();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!verificationData || !verificationData.badge.show_in_profile) {
    return null;
  }

  const { score, level, badge } = verificationData;

  // Inline display
  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <span>{badge.icon}</span>
        <span className="text-gray-700">{badge.label}</span>
        {showScore && <span className="text-gray-500">({score}%)</span>}
      </span>
    );
  }

  // Compact display
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <VerificationBadge
          score={score}
          level={level}
          size="small"
          showScore={showScore}
        />
      </div>
    );
  }

  // Full display with details
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm text-gray-600 mb-1">Verification Status</div>
          <VerificationBadge
            score={score}
            level={level}
            size="medium"
            showScore={showScore}
          />
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{score}%</div>
          <div className="text-xs text-gray-600">Verified</div>
        </div>
      </div>

      {showDetails && (
        <>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Trust indicators */}
          <div className="space-y-2">
            {score >= 70 && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span>✓</span>
                <span>Fully Verified Student</span>
              </div>
            )}
            {score >= 31 && score < 70 && (
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <span>📧</span>
                <span>University Email Verified</span>
              </div>
            )}
            {score < 31 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>○</span>
                <span>Verification in progress</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
