'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VerificationBadge from './VerificationBadge';

/**
 * VerificationPrompt Component
 * 
 * Shows a clear, actionable prompt when user needs to complete verification
 * to access a feature.
 */
export default function VerificationPrompt({
  featureName = 'this feature',
  requiredScore = 70,
  requiredLevel = 'verified',
  currentScore = 0,
  currentLevel = 'unverified',
  reason = null,
}) {
  const router = useRouter();
  const pointsNeeded = Math.max(0, requiredScore - currentScore);

  const getLevelInfo = (level) => {
    const levels = {
      guest: {
        color: 'gray',
        icon: '👤',
        title: 'Guest',
      },
      unverified: {
        color: 'red',
        icon: '⚠️',
        title: 'Unverified',
      },
      basic: {
        color: 'yellow',
        icon: '📧',
        title: 'Basic Verified',
      },
      verified: {
        color: 'green',
        icon: '✓',
        title: 'Verified Student',
      },
      premium: {
        color: 'purple',
        icon: '⭐',
        title: 'Premium Verified',
      },
    };
    return levels[level] || levels.unverified;
  };

  const currentLevelInfo = getLevelInfo(currentLevel);
  const requiredLevelInfo = getLevelInfo(requiredLevel);

  const getVerificationSteps = () => {
    const steps = [];
    
    if (currentScore < 31) {
      steps.push({
        title: 'Verify University Email',
        description: 'Connect your .edu email address',
        points: '+30%',
        action: '/verification',
      });
    }
    
    if (currentScore < 70) {
      steps.push({
        title: 'Upload Student ID',
        description: 'Verify your student status',
        points: '+40%',
        action: '/verification',
      });
    }

    return steps;
  };

  const steps = getVerificationSteps();

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6 border border-blue-200">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🔒</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verification Required
            </h2>
            <p className="text-gray-700 text-lg">
              Complete verification to access <strong>{featureName}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Current vs Required Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Status */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Your Status</div>
          <VerificationBadge
            score={currentScore}
            level={currentLevel}
            size="large"
          />
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {currentScore}%
          </div>
        </div>

        {/* Required Status */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-2">Required</div>
          <VerificationBadge
            score={requiredScore}
            level={requiredLevel}
            size="large"
          />
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {requiredScore}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Verification Progress</span>
          <span className="font-semibold">{pointsNeeded} points needed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (currentScore / requiredScore) * 100)}%` }}
          />
        </div>
      </div>

      {/* Verification Steps */}
      {steps.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Complete These Steps
          </h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-semibold text-gray-900">
                        {step.title}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        {step.points}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                  <Link
                    href={step.action}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Start
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>🎁</span>
          <span>Benefits of Verification</span>
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Access to {featureName}</span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Student discounts (15-20% off)</span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Priority booking access</span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Verified student badge</span>
          </li>
          <li className="flex items-start gap-2 text-gray-700">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Enhanced community features</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link
          href="/verification"
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
        >
          Complete Verification
        </Link>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          Go Back
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>
          Need help?{' '}
          <Link href="/support" className="text-blue-600 hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
