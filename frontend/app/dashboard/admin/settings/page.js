"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { adminSidebarItems } from '../page';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    platformFee: 0,
    maxApplicationsPerStudent: 5,
    maintenanceResponseTime: 24,
    emailNotifications: true,
    smsNotifications: false,
    autoApproval: false,
    verificationRequired: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (session) {
      fetchSettings();
    }
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSuccess('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!session || loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <DashboardLayout sidebarItems={adminSidebarItems}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="text-gray-600">Configure platform-wide settings and policies</p>
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

        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* Platform Fees */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Platform Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Platform Fee (%)</label>
                <input
                  type="number"
                  value={settings.platformFee}
                  onChange={(e) => handleInputChange('platformFee', parseFloat(e.target.value))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Percentage charged on each transaction</p>
              </div>
            </div>
          </div>

          {/* Application Limits */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Application Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Applications per Student</label>
                <input
                  type="number"
                  value={settings.maxApplicationsPerStudent}
                  onChange={(e) => handleInputChange('maxApplicationsPerStudent', parseInt(e.target.value))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum rental applications a student can submit</p>
              </div>
            </div>
          </div>

          {/* Service Levels */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Service Levels</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Maintenance Response Time (hours)</label>
                <input
                  type="number"
                  value={settings.maintenanceResponseTime}
                  onChange={(e) => handleInputChange('maintenanceResponseTime', parseInt(e.target.value))}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="168"
                />
                <p className="text-xs text-gray-500 mt-1">Expected response time for maintenance requests</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm">
                  Enable email notifications
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smsNotifications"
                  checked={settings.smsNotifications}
                  onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="smsNotifications" className="ml-2 block text-sm">
                  Enable SMS notifications
                </label>
              </div>
            </div>
          </div>

          {/* Automation */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Automation</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApproval"
                  checked={settings.autoApproval}
                  onChange={(e) => handleInputChange('autoApproval', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApproval" className="ml-2 block text-sm">
                  Auto-approve applications (for verified users only)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="verificationRequired"
                  checked={settings.verificationRequired}
                  onChange={(e) => handleInputChange('verificationRequired', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="verificationRequired" className="ml-2 block text-sm">
                  Require user verification for property listings
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
