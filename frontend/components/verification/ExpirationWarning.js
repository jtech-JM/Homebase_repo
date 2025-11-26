'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/**
 * ExpirationWarning Component
 * 
 * Shows warning when verification is expiring or expired.
 */
export default function ExpirationWarning({
  showInline = false,
  dismissible = true,
}) {
  const { data: session } = useSession();
  const [expirationData, setExpirationData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiration = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/renewal/my-expiration/`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setExpirationData(data);
        }
      } catch (error) {
        console.error('Error fetching expiration:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiration();
  }, [session]);

  if (loading || !expirationData || dismissed) {
    return null;
  }

  // Don't show if verification is active and not expiring soon
  if (expirationData.status === 'active' && !expirationData.requires_renewal) {
    return null;
  }

  const getWarningConfig = (status, daysUntil) => {
    if (status === 'expired') {
      return {
        color: 'bg-red-50 border-red-300 text-red-800',
        icon: '⚠️',
        title: 'Verification Expired',
        urgency: 'high',
      };
    } else if (daysUntil <= 7) {
      return {
        color: 'bg-orange-50 border-orange-300 text-orange-800',
        icon: '⏰',
        title: 'Verification Expiring Soon',
        urgency: 'medium',
      };
    } else {
      return {
        color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
        icon: '📅',
        title: 'Verification Expiring',
        urgency: 'low',
      };
    }
  };

  const config = getWarningConfig(
    expirationData.status,
    expirationData.days_until_expiration
  );

  // Inline version
  if (showInline) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color}`}>
        <span>{config.icon}</span>
        <span className="text-sm font-medium">
          {expirationData.status === 'expired'
            ? 'Verification expired'
            : `Expires in ${expirationData.days_until_expiration} days`}
        </span>
        <Link
          href="/verify-student/renew"
          className="text-sm underline font-semibold"
        >
          Renew
        </Link>
      </div>
    );
  }

  // Full banner version
  return (
    <div className={`rounded-lg border-2 p-4 ${config.color} relative`}>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-current opacity-60 hover:opacity-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex items-start gap-4">
        <div className="text-3xl">{config.icon}</div>
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-2">{config.title}</h3>
          
          {expirationData.status === 'expired' ? (
            <>
              <p className="mb-3">
                Your student verification has expired.
                {expirationData.in_grace_period && expirationData.grace_period_ends_at && (
                  <> You have until{' '}
                    <strong>
                      {new Date(expirationData.grace_period_ends_at).toLocaleDateString()}
                    </strong>
                    {' '}to renew and maintain your benefits.
                  </>
                )}
              </p>
              {expirationData.penalties?.access_reduced && (
                <div className="mb-3 p-3 bg-white bg-opacity-50 rounded-lg">
                  <p className="font-semibold">Access Reduced:</p>
                  <p className="text-sm">{expirationData.penalties.message}</p>
                </div>
              )}
            </>
          ) : (
            <p className="mb-3">
              Your verification expires in{' '}
              <strong>{expirationData.days_until_expiration} days</strong>
              {' '}on{' '}
              <strong>
                {new Date(expirationData.expires_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </strong>
            </p>
          )}

          <div className="mb-4">
            <p className="text-sm font-semibold mb-2">You'll lose access to:</p>
            <ul className="text-sm space-y-1">
              <li>• Student discounts (15-20% off)</li>
              <li>• Priority booking</li>
              <li>• Community features</li>
              <li>• Verified student badge</li>
            </ul>
          </div>

          <Link
            href="/verify-student/renew"
            className="inline-block px-6 py-2 bg-current text-white rounded-lg hover:opacity-90 transition-opacity font-semibold"
            style={{
              backgroundColor: config.urgency === 'high' ? '#dc2626' : config.urgency === 'medium' ? '#ea580c' : '#ca8a04'
            }}
          >
            Renew Verification Now
          </Link>
        </div>
      </div>
    </div>
  );
}
