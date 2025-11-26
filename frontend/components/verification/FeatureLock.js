'use client';

import Link from 'next/link';

/**
 * FeatureLock Component
 * 
 * Compact component to indicate a feature is locked behind verification.
 * Used for inline feature restrictions.
 */
export default function FeatureLock({
  featureName = 'this feature',
  requiredScore = 70,
  currentScore = 0,
  compact = false,
  inline = false,
}) {
  const pointsNeeded = Math.max(0, requiredScore - currentScore);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-300">
        <span className="text-gray-600">🔒</span>
        <span className="text-sm text-gray-700 font-medium">
          Requires {requiredScore}% verification
        </span>
        <Link
          href="/verification"
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          Unlock
        </Link>
      </div>
    );
  }

  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
        <span>🔒</span>
        <span>Verification required</span>
        <Link href="/verification" className="text-blue-600 hover:underline ml-1">
          ({pointsNeeded} points needed)
        </Link>
      </span>
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Feature Locked
      </h3>
      <p className="text-gray-600 mb-4">
        Complete verification to access {featureName}
      </p>
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="text-sm text-gray-600">
          Current: <span className="font-semibold">{currentScore}%</span>
        </div>
        <div className="text-gray-400">→</div>
        <div className="text-sm text-gray-600">
          Required: <span className="font-semibold">{requiredScore}%</span>
        </div>
      </div>
      <Link
        href="/verification"
        className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Complete Verification
      </Link>
    </div>
  );
}
