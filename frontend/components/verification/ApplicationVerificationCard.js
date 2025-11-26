'use client';

import VerificationBadge from './VerificationBadge';

/**
 * ApplicationVerificationCard Component
 * 
 * Displays verification highlights for student applications (landlord view).
 */
export default function ApplicationVerificationCard({
  application,
  showActions = false,
  onApprove = null,
  onReject = null,
}) {
  const { student, listing, status, created_at } = application;
  const { verification, highlights } = student;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      active: 'bg-blue-100 text-blue-800 border-blue-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getHighlightStyle = (type) => {
    const styles = {
      success: 'bg-green-50 border-green-200 text-green-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      badge: 'bg-purple-50 border-purple-200 text-purple-800',
    };
    return styles[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {student.name}
            </h3>
            <VerificationBadge
              score={verification.score}
              level={verification.level}
              size="small"
            />
          </div>
          <p className="text-sm text-gray-600">{student.email}</p>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(status)}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      {/* Listing Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">Applying for</div>
        <div className="font-medium text-gray-900">{listing.title}</div>
      </div>

      {/* Verification Highlights */}
      {highlights && highlights.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Verification Status
          </div>
          <div className="space-y-2">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2 rounded-lg border ${getHighlightStyle(highlight.type)}`}
              >
                <span className="text-lg">{highlight.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{highlight.text}</div>
                  {highlight.description && (
                    <div className="text-xs opacity-75 mt-0.5">
                      {highlight.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">Verification Score</span>
          <span className="font-semibold text-gray-900">{verification.score}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-full rounded-full transition-all ${
              verification.score >= 70
                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                : verification.score >= 31
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500'
                : 'bg-gradient-to-r from-gray-400 to-gray-500'
            }`}
            style={{ width: `${verification.score}%` }}
          />
        </div>
      </div>

      {/* Trust Indicators */}
      {verification.score >= 70 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-sm text-green-800">
            <span className="text-lg">🛡️</span>
            <div>
              <div className="font-semibold">Trusted Student</div>
              <div className="text-xs">Eligible for all features and benefits</div>
            </div>
          </div>
        </div>
      )}

      {/* Application Date */}
      <div className="text-xs text-gray-500 mb-4">
        Applied {new Date(created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>

      {/* Actions */}
      {showActions && status === 'pending' && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => onApprove && onApprove(application.id)}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Approve
          </button>
          <button
            onClick={() => onReject && onReject(application.id)}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
