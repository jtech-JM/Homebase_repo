"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page - /verify-student now redirects to /verification
 * This maintains backward compatibility with old links
 */
export default function VerifyStudentPage() {
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFlow, setShowFlow] = useState(false);

  useEffect(() => {
    if (session?.user) {
      checkVerificationStatus();
    }
  }, [session]);

  const checkVerificationStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/status/`, {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = (verificationData, score) => {
    setVerificationStatus({
      status: score >= 70 ? 'approved' : 'pending',
      score: score,
      completedSteps: Object.keys(verificationData).length
    });
    setShowFlow(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'pending':
        return <Clock className="w-8 h-8 text-yellow-500" />;
      case 'rejected':
        return <AlertTriangle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'approved':
        return {
          title: 'Verification Complete!',
          message: 'Your student status has been verified. You now have access to all student features.',
          color: 'text-green-700'
        };
      case 'pending':
        return {
          title: 'Verification In Progress',
          message: 'Your verification is being reviewed by our team. This usually takes 1-2 business days.',
          color: 'text-yellow-700'
        };
      case 'rejected':
        return {
          title: 'Verification Needs Attention',
          message: 'We need additional information to verify your student status. Please try again.',
          color: 'text-red-700'
        };
      default:
        return {
          title: 'Start Verification',
          message: 'Verify your student status to access exclusive student housing and features.',
          color: 'text-gray-700'
        };
    }
  };

  if (loading) {
    return (
      <RoleProtectedLayout allowedRoles={['student']}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </RoleProtectedLayout>
    );
  }

  if (showFlow) {
    return (
      <RoleProtectedLayout allowedRoles={['student']}>
        <div className="min-h-screen bg-gray-50 py-8">
          <StudentVerificationFlow 
            onComplete={handleVerificationComplete}
            isOptional={false}
          />
        </div>
      </RoleProtectedLayout>
    );
  }

  const statusInfo = getStatusMessage(verificationStatus?.status);

  return (
    <RoleProtectedLayout allowedRoles={['student']}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Student Verification
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Verify your student status to unlock exclusive housing options and student benefits
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              {getStatusIcon(verificationStatus?.status)}
              <h2 className={`text-2xl font-semibold mt-4 ${statusInfo.color}`}>
                {statusInfo.title}
              </h2>
              <p className="text-gray-600 mt-2 max-w-md mx-auto">
                {statusInfo.message}
              </p>
            </div>

            {/* Verification Score */}
            {verificationStatus?.score && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Verification Score</span>
                  <span className="text-sm font-medium text-gray-700">
                    {verificationStatus.score}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      verificationStatus.score >= 70 ? 'bg-green-500' : 
                      verificationStatus.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${verificationStatus.score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum score required: 70/100
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!verificationStatus || verificationStatus.status === 'rejected' ? (
                <button
                  onClick={() => setShowFlow(true)}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Verification
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : verificationStatus.status === 'pending' ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setShowFlow(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add More Information
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => router.push('/dashboard/student')}
                    className="flex items-center justify-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/dashboard/student')}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Verification Methods */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                📄
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Document Upload</h3>
              <p className="text-sm text-gray-600">
                Upload your student ID card or enrollment letter for verification
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                📧
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">University Email</h3>
              <p className="text-sm text-gray-600">
                Verify your official university email address (.edu domain)
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                📱
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Verification</h3>
              <p className="text-sm text-gray-600">
                Verify your phone number via SMS for additional security
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                👥
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Peer Verification</h3>
              <p className="text-sm text-gray-600">
                Get verified by other students from your university
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                🌐
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Social Media</h3>
              <p className="text-sm text-gray-600">
                Link your LinkedIn or Facebook profile (optional)
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                📍
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Location Check</h3>
              <p className="text-sm text-gray-600">
                Verify you're near your university campus (optional)
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Benefits of Student Verification
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Exclusive Student Housing</h4>
                  <p className="text-gray-600 text-sm">Access to student-only properties and dormitories</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Priority Booking</h4>
                  <p className="text-gray-600 text-sm">Get first access to popular properties near campus</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Student Discounts</h4>
                  <p className="text-gray-600 text-sm">Special pricing and offers for verified students</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">Enhanced Trust</h4>
                  <p className="text-gray-600 text-sm">Verified badge increases landlord confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtectedLayout>
  );
}