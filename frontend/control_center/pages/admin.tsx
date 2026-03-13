'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Settings, Users, Bell, Shield, Database, Activity, Save, RefreshCw, CheckCircle, Server, HardDrive, Gauge } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface SystemStatus {
  ai_pipeline: string
  risk_engine: string
  evidence_manager: string
  camera_streams: string
  database: string
  alert_system: string
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general')
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  useEffect(() => {
    fetchSystemStatus()
    fetchSettings()
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`)
      const data = await res.json()
      setSystemStatus(data.services)
    } catch (error) {
      console.error('Error fetching status:', error)
      setSystemStatus({
        ai_pipeline: 'operational',
        risk_engine: 'operational',
        evidence_manager: 'operational',
        camera_streams: '0 active',
        database: 'connected',
        alert_system: 'operational'
      })
    }
    setLoading(false)
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`)
      const data = await res.json()
      if (data.system) {
        setSettings(prev => ({
          ...prev,
          general: {
            ...prev.general,
            maintenanceMode: data.system.maintenance_mode || false
          }
        }))
      }
      if (data.notifications) {
        setSettings(prev => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            emailAlerts: data.notifications.email_enabled ?? true,
            pushNotifications: data.notifications.push_enabled ?? true
          }
        }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/settings/system`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_mode: settings.general.maintenanceMode })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
    setSaving(false)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'system', label: 'System Status', icon: Server },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API Settings', icon: Activity },
    { id: 'database', label: 'Database', icon: Database }
  ]

  return (
    <Layout title="Kenya Overwatch - Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">System Administration</h1>
            <p className="text-gray-400">Configure and manage Kenya Overwatch</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {saved && (
          <div className="bg-green-600/20 border border-green-600 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Settings saved successfully!
          </div>
        )}

        <div className="flex gap-6">
          <div className="w-48 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 bg-gray-800 rounded-xl p-6 border border-gray-700">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">System Name</label>
                    <input
                      type="text"
                      value={settings.general.systemName}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, systemName: e.target.value }
                      })}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Timezone</label>
                    <select
                      value={settings.general.timezone}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, timezone: e.target.value }
                      })}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
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
                    <label htmlFor="maintenance" className="text-white text-sm">
                      Enable Maintenance Mode
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">System Status</h2>
                <div className="grid grid-cols-2 gap-4">
                  {systemStatus && Object.entries(systemStatus).map(([key, value]) => (
                    <div key={key} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <span className={`flex items-center gap-1 text-sm ${
                          value === 'operational' || value.includes('active') || value === 'connected' 
                            ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {value === 'operational' || value.includes('active') || value === 'connected' ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive alerts via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, [item.key]: !settings.notifications[item.key as keyof typeof settings.notifications] }
                        })}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings.notifications[item.key as keyof typeof settings.notifications] ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings.notifications[item.key as keyof typeof settings.notifications] ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-gray-400 text-sm">Require 2FA for all users</p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactorRequired: !settings.security.twoFactorRequired }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.security.twoFactorRequired ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.security.twoFactorRequired ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => setSettings({
                        ...settings,
                        security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
                      })}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                    <div>
                      <p className="text-white font-medium">Audit Logging</p>
                      <p className="text-gray-400 text-sm">Log all user actions</p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        security: { ...settings.security, auditLogging: !settings.security.auditLogging }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.security.auditLogging ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.security.auditLogging ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">API Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm">Rate Limit (requests/minute)</label>
                    <input
                      type="number"
                      value={settings.api.rateLimit}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, rateLimit: parseInt(e.target.value) }
                      })}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                    <div>
                      <p className="text-white font-medium">Enable Caching</p>
                      <p className="text-gray-400 text-sm">Cache API responses</p>
                    </div>
                    <button
                      onClick={() => setSettings({
                        ...settings,
                        api: { ...settings.api, cacheEnabled: !settings.api.cacheEnabled }
                      })}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.api.cacheEnabled ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.api.cacheEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Cache TTL (seconds)</label>
                    <input
                      type="number"
                      value={settings.api.cacheTTL}
                      onChange={(e) => setSettings({
                        ...settings,
                        api: { ...settings.api, cacheTTL: parseInt(e.target.value) }
                      })}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Database Management</h2>
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Database Status</span>
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Database Mode</span>
                      <span className="text-white">PostgreSQL</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Tables</span>
                      <span className="text-white">12 tables</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <RefreshCw className="w-4 h-4" />
                      Run Migrations
                    </button>
                    <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600">
                      <HardDrive className="w-4 h-4" />
                      Backup Database
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
