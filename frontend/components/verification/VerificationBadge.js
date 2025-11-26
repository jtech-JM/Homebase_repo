'use client';

/**
 * VerificationBadge Component
 * 
 * Displays a user's verification status as a badge with appropriate styling.
 */
export default function VerificationBadge({
  score = 0,
  level = 'unverified',
  size = 'medium',
  showScore = false,
  showLabel = true,
  className = '',
}) {
  const getBadgeConfig = (level, score) => {
    if (score >= 70) {
      return {
        color: 'bg-green-100 text-green-800 border-green-300',
        icon: '✓',
        label: 'Verified Student',
        gradient: 'from-green-400 to-emerald-500',
      };
    } else if (score >= 31) {
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '📧',
        label: 'Basic Verified',
        gradient: 'from-blue-400 to-indigo-500',
      };
    } else if (score > 0) {
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: '⚠️',
        label: 'Partial Verification',
        gradient: 'from-yellow-400 to-orange-500',
      };
    } else {
      return {
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: '○',
        label: 'Unverified',
        gradient: 'from-gray-400 to-gray-500',
      };
    }
  };

  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-3 py-1',
    large: 'text-base px-4 py-2',
  };

  const iconSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-lg',
  };

  const config = getBadgeConfig(level, score);
  const sizeClass = sizeClasses[size] || sizeClasses.medium;
  const iconSize = iconSizes[size] || iconSizes.medium;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${config.color} ${sizeClass} ${className}`}
    >
      <span className={iconSize}>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
      {showScore && <span className="ml-1">({score}%)</span>}
    </div>
  );
}
