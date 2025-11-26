'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * RenewalFlow Component
 * 
 * Handles verification renewal process.
 */
export default function RenewalFlow() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [renewalType, setRenewalType] = useState('full');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const renewalTypes = [
    {
      value: 'full',
      title: 'Full Verification Renewal',
      description: 'Renew all verification methods',
      icon: '✓',
      recommended: true,
    },
    {
      value: 'university_email',
      title: 'University Email Only',
      description: 'Renew university email verification',
      icon: '📧',
    },
    {
      value: 'student_id',
      title: 'Student ID Only',
      description: 'Renew student ID verification',
      icon: '🆔',
    },
  ];

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/renewal/request-renewal/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          renewal_type: renewalType,
          documents: documents,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setStep(3);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit renewal request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-24 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Select Type</span>
          <span>Review</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step 1: Select Renewal Type */}
      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Select Renewal Type
          </h2>
          <p className="text-gray-600 mb-6">
            Choose which verification methods you'd like to renew
          </p>

          <div className="space-y-4">
            {renewalTypes.map((type) => (
              <div
                key={type.value}
                onClick={() => setRenewalType(type.value)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  renewalType === type.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={renewalType === type.value}
                    onChange={() => setRenewalType(type.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{type.icon}</span>
                      <span className="font-semibold text-gray-900">
                        {type.title}
                      </span>
                      {type.recommended && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Review and Submit */}
      {step === 2 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Review and Submit
          </h2>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Renewal Summary</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Renewal Type</div>
                <div className="font-medium text-gray-900">
                  {renewalTypes.find(t => t.value === renewalType)?.title}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Processing Time</div>
                <div className="font-medium text-gray-900">1-2 business days</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Renewal Request'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && success && (
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Renewal Request Submitted!
          </h2>
          <p className="text-gray-600 mb-6">
            Your verification renewal request has been submitted successfully.
            We'll review it within 1-2 business days and notify you via email.
          </p>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-gray-700 space-y-2 text-left">
              <li>• We'll review your renewal request</li>
              <li>• You'll receive an email notification</li>
              <li>• Your verification will be renewed upon approval</li>
              <li>• You'll maintain access during the review period</li>
            </ul>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}
