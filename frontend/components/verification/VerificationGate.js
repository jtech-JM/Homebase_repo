'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import VerificationPrompt from './VerificationPrompt';
import FeatureLock from './FeatureLock';

/**
 * VerificationGate Component
 * 
 * Wraps content that requires verification and shows appropriate fallback
 * when user doesn't meet verification requirements.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to show when verified
 * @param {number} props.requiredScore - Minimum verification score required (0-100)
 * @param {string} props.requiredLevel - Required verification level (basic, verified, premium)
 * @param {string} props.featureName - Name of the feature being gated
 * @param {React.ReactNode} props.fallback - Custom fallback content (optional)
 * @param {boolean} props.showPrompt - Whether to show verification prompt (default: true)
 * @param {Function} props.onAccessDenied - Callback when access is denied
 */
export default function VerificationGate({
  children,
  requiredScore = 0,
  requiredLevel = 'basic',
  featureName = 'this feature',
  fallback = null,
  showPrompt = true,
  onAccessDenied = null,
}) {
  const { data: session, status } = useSession();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVerification = async () => {
      if (status === 'loading') return;
      
      if (!session?.user) {
        setVerificationStatus({
          hasAccess: false,
          score: 0,
          level: 'guest',
          reason: 'Login required'
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch user's verification status
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/my-status/`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          const hasAccess = data.score >= requiredScore;
          
          setVerificationStatus({
            hasAccess,
            score: data.score,
            level: data.level,
            reason: hasAccess ? null : `Requires ${requiredScore}% verification`,
            methods: data.methods || [],
          });

          if (!hasAccess && onAccessDenied) {
            onAccessDenied(data);
          }
        } else {
          setVerificationStatus({
            hasAccess: false,
            score: 0,
            level: 'unverified',
            reason: 'Unable to verify status'
          });
        }
      } catch (error) {
        console.error('Error checking verification:', error);
        setVerificationStatus({
          hasAccess: false,
          score: 0,
          level: 'unverified',
          reason: 'Verification check failed'
        });
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [session, status, requiredScore, onAccessDenied]);

  // Loading state
  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // User has access - show content
  if (verificationStatus?.hasAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback - show verification prompt
  if (showPrompt) {
    return (
      <VerificationPrompt
        featureName={featureName}
        requiredScore={requiredScore}
        requiredLevel={requiredLevel}
        currentScore={verificationStatus?.score || 0}
        currentLevel={verificationStatus?.level || 'unverified'}
        reason={verificationStatus?.reason}
      />
    );
  }

  // No fallback - show feature lock
  return (
    <FeatureLock
      featureName={featureName}
      requiredScore={requiredScore}
      currentScore={verificationStatus?.score || 0}
    />
  );
}
