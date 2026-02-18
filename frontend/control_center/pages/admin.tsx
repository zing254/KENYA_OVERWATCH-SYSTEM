import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { Settings, Users, Bell, Shield, Database, Activity, Save, RefreshCw } from 'lucide-react'

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    general: {
      systemName: 'Kenya Overwatch Production',
      timezone: 'Africa/Nairobi',
      language: 'en',
      maintenanceMode: false
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      alertThreshold: 'high',
      dailyDigest: true
    },
    security: {
      twoFactorRequired: true,
      sessionTimeout: 30,
      ipWhitelist: '',
      auditLogging: true
    },
    api: {
      rateLimit: 100,
      cacheEnabled: true,
      cacheTTL: 60,
      apiVersion: 'v2'
    }
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Settings', icon: Activity },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'database', label: 'Database', icon: Database }
  ]

  return (
    <Layout title="Kenya Overwatch - Admin Settings">
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6">
          <h1 className="text-2xl font-bold text-white">System Administration</h1>
          <p className="text-blue-200">Configure and manage Kenya Overwatch settings</p>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-64 bg-white rounded-lg shadow">
              <nav className="p-4">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-lg shadow p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">General Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        System Name
                      </label>
                      <input
                        type="text"
                        value={settings.general.systemName}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, systemName: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timezone
                      </label>
                      <select
                        value={settings.general.timezone}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, timezone: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
                        <option value="UTC">UTC</option>
                        <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="maintenance"
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, maintenanceMode: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label htmlFor="maintenance" className="text-sm text-gray-700">
                        Enable Maintenance Mode
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Email Alerts</p>
                        <p className="text-sm text-gray-500">Receive alerts via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, emailAlerts: e.target.checked }
                        })}
                        className="toggle"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-500">Browser push notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, pushNotifications: e.target.checked }
                        })}
                        className="toggle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Alert Threshold
                      </label>
                      <select
                        value={settings.notifications.alertThreshold}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, alertThreshold: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="low">Low and above</option>
                        <option value="medium">Medium and above</option>
                        <option value="high">High only</option>
                        <option value="critical">Critical only</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-500">Require 2FA for all users</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorRequired}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, twoFactorRequired: e.target.checked }
                        })}
                        className="toggle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        value={settings.security.sessionTimeout}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Audit Logging</p>
                        <p className="text-sm text-gray-500">Log all user actions</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.security.auditLogging}
                        onChange={(e) => setSettings({
                          ...settings,
                          security: { ...settings.security, auditLogging: e.target.checked }
                        })}
                        className="toggle"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">API Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rate Limit (requests/minute)
                      </label>
                      <input
                        type="number"
                        value={settings.api.rateLimit}
                        onChange={(e) => setSettings({
                          ...settings,
                          api: { ...settings.api, rateLimit: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">Enable Caching</p>
                        <p className="text-sm text-gray-500">Cache API responses</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.api.cacheEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          api: { ...settings.api, cacheEnabled: e.target.checked }
                        })}
                        className="toggle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cache TTL (seconds)
                      </label>
                      <input
                        type="number"
                        value={settings.api.cacheTTL}
                        onChange={(e) => setSettings({
                          ...settings,
                          api: { ...settings.api, cacheTTL: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">User Management</h2>
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">User management panel</p>
                    <p className="text-sm text-gray-400">Manage operators, supervisors, and admins</p>
                  </div>
                </div>
              )}

              {activeTab === 'database' && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Database Management</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Database Status</span>
                        <span className="text-green-600">Connected</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Database Mode</span>
                        <span className="text-gray-800">In-Memory (Demo)</span>
                      </div>
                    </div>
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <RefreshCw className="w-4 h-4" />
                      Run Database Migration
                    </button>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t flex justify-end gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
                    saved
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : saved ? (
                    <>
                      <Save className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
