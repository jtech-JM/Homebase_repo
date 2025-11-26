"use client";
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ReuploadRequest from '@/components/verification/ReuploadRequest';
import { 
  Upload, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  GraduationCap,
  Building,
  User,
  Camera,
  ArrowDown
} from 'lucide-react';

export default function VerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMethod, setActiveMethod] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const methodsRef = useRef(null);
  const [highlightedMethod, setHighlightedMethod] = useState(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchVerificationStatus();
    }
  }, [status, router]);

  // Handle auto-scroll and highlight when coming from "Verify Now" button
  useEffect(() => {
    const autoStart = searchParams.get('start');
    if (autoStart === 'true' && verificationStatus && methodsRef.current) {
      // Scroll to methods section
      setTimeout(() => {
        methodsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Find and highlight first incomplete method
        const firstIncomplete = verificationMethods.find(m => !m.completed);
        if (firstIncomplete) {
          setHighlightedMethod(firstIncomplete.id);
          // Auto-open the first incomplete method after scroll
          setTimeout(() => {
            setActiveMethod(firstIncomplete.id);
            // Clear highlight after 3 seconds
            setTimeout(() => setHighlightedMethod(null), 3000);
          }, 800);
        }
      }, 500);
    }
  }, [searchParams, verificationStatus]);

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/my-status/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVerificationStatus(data);
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (verificationType) => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('document', uploadFile);
    formData.append('verification_type', verificationType);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verifications/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        setSuccess('Document uploaded successfully! Your verification score will be updated shortly.');
        setUploadFile(null);
        setActiveMethod(null);
        // Refresh verification status
        setTimeout(() => {
          fetchVerificationStatus();
          setSuccess('');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Upload failed. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePhoneVerification = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/phone/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      if (response.ok) {
        setSuccess('Verification code sent to your phone!');
        setPhoneNumber('');
        setActiveMethod(null);
      } else {
        setError('Failed to send verification code. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const verificationMethods = [
    {
      id: 'student_id',
      title: 'Student ID',
      description: 'Upload your student ID card or document',
      icon: <GraduationCap className="w-6 h-6" />,
      points: '+50%',
      color: 'from-blue-500 to-blue-600',
      completed: verificationStatus?.methods_completed?.includes('student_id_upload') || verificationStatus?.methods_completed?.includes('student_id'),
      type: 'upload',
    },
    {
      id: 'enrollment',
      title: 'Enrollment Letter',
      description: 'Upload your enrollment verification letter',
      icon: <FileText className="w-6 h-6" />,
      points: '+40%',
      color: 'from-amber-500 to-amber-600',
      completed: verificationStatus?.methods_completed?.includes('enrollment'),
      type: 'upload',
    },
    {
      id: 'profile_photo',
      title: 'Profile Photo',
      description: 'Upload via your profile page',
      icon: <User className="w-6 h-6" />,
      points: '+10%',
      color: 'from-pink-500 to-pink-600',
      completed: verificationStatus?.methods_completed?.includes('profile_photo'),
      type: 'link',
      link: '/dashboard/student/profile',
    },
  ];

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate completion stats
  const completedMethods = verificationMethods.filter(m => m.completed);
  const remainingMethods = verificationMethods.filter(m => !m.completed);
  const completionPercentage = Math.round((completedMethods.length / verificationMethods.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Verification Center</h1>
                <p className="text-gray-600">Complete verification methods to unlock features and discounts</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold text-blue-600 mb-1">
                  {verificationStatus?.score || 0}%
                </div>
                <div className="text-sm text-gray-500">Verification Score</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${verificationStatus?.score || 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0%</span>
                <span>30%</span>
                <span>70%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Next Milestone */}
            {verificationStatus?.next_milestone && (
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">
                      Next Milestone: {verificationStatus.next_milestone.score}% ({verificationStatus.next_milestone.level})
                    </p>
                    <p className="text-sm text-blue-700">
                      {verificationStatus.next_milestone.points_needed} points needed to unlock: {verificationStatus.next_milestone.benefits.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Re-upload Request Alert */}
        {verificationStatus && (
          <div className="mb-8">
            <ReuploadRequest 
              verification={verificationStatus} 
              onReupload={fetchVerificationStatus}
            />
          </div>
        )}

        {/* Completion Summary */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedMethods.length}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {completedMethods.map(method => (
                <div key={method.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{method.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className="text-2xl font-bold text-amber-600">{remainingMethods.length}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {remainingMethods.map(method => (
                <div key={method.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>{method.title}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold text-blue-600">{completionPercentage}%</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {completedMethods.length} of {verificationMethods.length} methods completed
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-800">
              ×
            </button>
          </div>
        )}

        {/* Quick Start Button */}
        {remainingMethods.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Ready to increase your verification score?</h3>
                <p className="text-blue-100">
                  Complete {remainingMethods.length} more {remainingMethods.length === 1 ? 'method' : 'methods'} to unlock more features
                </p>
              </div>
              <button
                onClick={() => {
                  methodsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  const firstIncomplete = verificationMethods.find(m => !m.completed);
                  if (firstIncomplete) {
                    setHighlightedMethod(firstIncomplete.id);
                    setTimeout(() => {
                      setActiveMethod(firstIncomplete.id);
                      setTimeout(() => setHighlightedMethod(null), 3000);
                    }, 800);
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
              >
                <ArrowDown className="w-5 h-5" />
                Start Next Method
              </button>
            </div>
          </div>
        )}

        {/* Verification Methods Grid */}
        <div ref={methodsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {verificationMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                method.completed
                  ? 'border-green-500'
                  : activeMethod === method.id
                  ? 'border-blue-500 shadow-xl'
                  : highlightedMethod === method.id
                  ? 'border-amber-500 shadow-xl ring-4 ring-amber-200 animate-pulse'
                  : 'border-gray-100 hover:border-blue-300 hover:shadow-xl'
              }`}
            >
              <div className={`bg-gradient-to-r ${method.color} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    {method.icon}
                  </div>
                  {method.completed && (
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-semibold">Completed</span>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">{method.title}</h3>
                <p className="text-sm opacity-90">{method.description}</p>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-gray-900">{method.points}</span>
                  <span className="text-sm text-gray-500">verification points</span>
                </div>

                {method.completed ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Verified</span>
                  </div>
                ) : method.type === 'link' ? (
                  <Link
                    href={method.link}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Go to Profile
                  </Link>
                ) : activeMethod === method.id ? (
                  <div className="space-y-4">
                    {method.type === 'upload' && (
                      <>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setUploadFile(e.target.files[0])}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFileUpload(method.id)}
                            disabled={!uploadFile || uploading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                          >
                            {uploading ? 'Uploading...' : 'Upload'}
                          </button>
                          <button
                            onClick={() => {
                              setActiveMethod(null);
                              setUploadFile(null);
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}

                    {method.type === 'email' && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          We'll send a verification link to your university email
                        </p>
                        <button
                          onClick={() => {
                            // Handle email verification
                            setSuccess('Verification email sent!');
                            setActiveMethod(null);
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          Send Verification Email
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveMethod(method.id)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                  >
                    Start Verification
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Accepted File Formats</h3>
              <p className="text-sm text-gray-600">PDF, JPG, JPEG, PNG (Max 5MB)</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Processing Time</h3>
              <p className="text-sm text-gray-600">Most verifications are reviewed within 24-48 hours</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
              <p className="text-sm text-gray-600">
                <Link href="/dashboard/student/support" className="text-blue-600 hover:underline">
                  Contact Support
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
