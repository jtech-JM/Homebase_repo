"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import RoleProtectedLayout from '@/components/auth/RoleProtectedLayout';
import { studentSidebarItems } from '../page';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Save, Edit, Camera, Upload } from 'lucide-react';

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
        firstName: session.user?.firstName || '',
        lastName: session.user?.lastName || '',
        email: session.user?.email || '',
        phone: data.phone || '',
        address: data.address || '',
        dateOfBirth: data.date_of_birth || '',
        university: data.major || '', // University stored in major field
        studentId: data.graduation_year || '', // Student ID stored in graduation_year field
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
      setError(error.message);
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

      if (!response.ok) throw new Error('Failed to save profile');
      const data = await response.json();
      setSuccess('Profile saved successfully!');
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
      setError('Failed to save profile. Please try again.');
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
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

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded border border-green-200 mb-4">
              {success}
            </div>
          )}

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
                  <label className="block text-sm font-medium mb-1">University</label>
                  <input
                    type="text"
                    value={profile.university}
                    onChange={(e) => handleInputChange('university', e.target.value)}
                    disabled={!editing}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Student ID</label>
                  <input
                    type="text"
                    value={profile.studentId}
                    onChange={(e) => handleInputChange('studentId', e.target.value)}
                    disabled={!editing}
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
      </DashboardLayout>
    </RoleProtectedLayout>
  );
}
