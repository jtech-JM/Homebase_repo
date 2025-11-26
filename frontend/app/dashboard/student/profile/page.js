"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import { studentSidebarItems } from '../page';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Save, Edit, Camera, Upload } from 'lucide-react';
import { 
  VerificationProgress, 
  VerificationBadge,
  ExpirationWarning,
  VerificationPrompt
} from '@/components/verification';

export default function StudentProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    university: '',
    studentId: '',
    major: '',
    graduationYear: '',
    bio: '',
    avatar: null,
  });
  const [verificationScore, setVerificationScore] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      // Fetch verification status
      const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/my-status/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (verificationResponse.ok) {
        const verificationData = await verificationResponse.json();
        setVerificationScore(verificationData.score || 0);
      }

      // Fetch profile
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      
      console.log('Profile data received:', data); // Debug log
      
      // Map profile data to form fields
      setProfile({
        firstName: data.first_name || session.user?.firstName || '',
        lastName: data.last_name || session.user?.lastName || '',
        email: data.email || session.user?.email || '',
        phone: data.phone || '',
        address: data.address || '',
        dateOfBirth: data.date_of_birth || '',
        university: data.university || '',
        studentId: data.student_id || '',
        major: data.major || '',
        graduationYear: data.graduation_year || '',
        bio: data.bio || '',
        avatar: data.avatar || null,
      });
      
      // Set avatar preview with cache-busting timestamp
      if (data.avatar) {
        // Check if avatar is already a full URL or just a path
        const avatarUrl = data.avatar.startsWith('http') 
          ? `${data.avatar}?t=${Date.now()}`
          : `${process.env.NEXT_PUBLIC_API_URL}${data.avatar}?t=${Date.now()}`;
        console.log('Setting avatar preview:', avatarUrl); // Debug log
        setAvatarPreview(avatarUrl);
      } else {
        console.log('No avatar in response'); // Debug log
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'We\'re having trouble loading your profile. Please refresh the page.';
      
      if (!navigator.onLine) {
        errorMessage = 'You appear to be offline. Please check your internet connection.';
      } else if (error.message && error.message.includes('401')) {
        errorMessage = 'Your session has expired. Please log in again.';
        setTimeout(() => window.location.href = '/login', 3000);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('phone', profile.phone || '');
      formData.append('address', profile.address || '');
      formData.append('date_of_birth', profile.dateOfBirth || '');
      formData.append('major', profile.major || '');
      formData.append('graduation_year', profile.graduationYear || '');
      formData.append('bio', profile.bio || '');
      
      // Add university and student_id for manual entry
      formData.append('university', profile.university || '');
      formData.append('student_id', profile.studentId || '');
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profiles/me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to save profile');
      }
      
      const data = await response.json();
      
      // Check if verification was invalidated
      if (data.verification_invalidated) {
        setSuccess(`Profile updated! ⚠️ ${data.message}`);
        // Show a more prominent warning
        setTimeout(() => {
          if (confirm('Your verification has been invalidated. Would you like to go to the verification page now?')) {
            window.location.href = '/verification?start=true';
          }
        }, 2000);
      } else {
        setSuccess('Profile saved successfully!');
      }
      
      setEditing(false);
      setAvatarFile(null);
      
      // Update avatar preview with new URL (add timestamp to bypass cache)
      if (data.avatar) {
        // Check if avatar is already a full URL or just a path
        const avatarUrl = data.avatar.startsWith('http') 
          ? `${data.avatar}?t=${Date.now()}`
          : `${process.env.NEXT_PUBLIC_API_URL}${data.avatar}?t=${Date.now()}`;
        setAvatarPreview(avatarUrl);
        setProfile(prev => ({ ...prev, avatar: data.avatar }));
      }
      
      // Refetch profile to ensure everything is in sync
      await fetchProfile();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'We encountered an issue while saving your profile. Please try again.';
      
      if (error.message) {
        // Use the error message from the server if available
        errorMessage = error.message;
      } else if (!navigator.onLine) {
        errorMessage = 'It looks like you\'re offline. Please check your internet connection and try again.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'We\'re having trouble connecting to our servers. Please check your connection and try again in a moment.';
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 10 seconds
      setTimeout(() => setError(''), 10000);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <RoleProtectedLayout allowedRoles={['student']}>
      <DashboardLayout sidebarItems={studentSidebarItems}>
        <div className="p-6">
          {/* Expiration Warning */}
          <div className="mb-6">
            <ExpirationWarning />
          </div>

          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <VerificationBadge score={verificationScore} size="md" />
              </div>
              <p className="text-gray-600 mt-1">Manage your personal information</p>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
            >
              <Edit className="w-4 h-4" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Verification Prompt */}
          {verificationScore < 70 && (
            <div className="mb-6">
              <VerificationPrompt
                title="Complete Your Verification"
                message="Increase your verification score to unlock all platform features and student discounts."
                requiredScore={70}
                currentScore={verificationScore}
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200 mb-6 flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                <p className="text-sm text-red-600 mt-1">If this problem persists, please contact our support team.</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Close error message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 text-green-800 rounded-lg border border-green-200 mb-6 flex items-start gap-3 animate-fadeIn">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="font-medium">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess('')} 
                className="text-green-600 hover:text-green-800 transition-colors"
                aria-label="Close success message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Verification Progress Sidebar */}
            <div className="lg:col-span-1">
              <VerificationProgress showMilestones={true} showNextSteps={true} />
            </div>

            {/* Profile Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Picture */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-gray-300">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error('Image failed to load:', avatarPreview);
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-16 h-16 text-gray-400" />
                        )}
                      </div>
                      {editing && (
                        <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-all duration-200 shadow-lg">
                          <Camera className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {profile.firstName} {profile.lastName}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{profile.email}</p>
                      {editing && (
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-all duration-200">
                          <Upload className="w-4 h-4" />
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>

            {/* Personal Information */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profile.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Academic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    University
                    <span className="text-xs text-gray-500 ml-2">(Can be manually entered)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., University of Nairobi"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Student ID
                    <span className="text-xs text-gray-500 ml-2">(Can be manually entered)</span>
                  </label>
                  <input
                    type="text"
                    value={profile.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., SCT211-0001/2021"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Major</label>
                  <input
                    type="text"
                    value={profile.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., Computer Science"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Graduation Year</label>
                  <input
                    type="number"
                    value={profile.graduationYear}
                    onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                    disabled={!editing}
                    placeholder="e.g., 2027"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">About Me</h2>
              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!editing}
                  rows={4}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

                {/* Save Button */}
                {editing && (
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}
