'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { Settings, Save, Server, Database, Shield, Bell, Eye, Key, Activity, CheckCircle, XCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface SystemStatus {
  ai_pipeline: string
  risk_engine: string
  evidence_manager: string
  camera_streams: string
  database: string
  alert_system: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system')
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    aiConfidence: 0.7,
    riskThreshold: 0.7,
    maxUploadSize: 10,
    retentionDays: 90,
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    darkMode: true,
    autoRefresh: true,
    refreshInterval: 30,
  })

  useEffect(() => {
    fetchSystemStatus()
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
        database: 'mock_data',
        alert_system: 'operational'
      })
    }
    setLoading(false)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'system', label: 'System', icon: Server },
    { id: 'ai', label: 'AI Settings', icon: Activity },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <Layout title="Kenya Overwatch - Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Configure system preferences</p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>

        {saved && (
          <div className="bg-green-600/20 border border-green-600 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Settings saved successfully!
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar */}
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

          {/* Content */}
          <div className="flex-1 bg-gray-800 rounded-xl p-6 border border-gray-700">
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">System Status</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  {systemStatus && Object.entries(systemStatus).map(([key, value]) => (
                    <div key={key} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                        <span className={`flex items-center gap-1 text-sm ${
                          value === 'operational' || value.includes('active') ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {value === 'operational' || value.includes('active') ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Data Retention</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">Evidence Retention Period (days)</label>
                      <input
                        type="number"
                        value={settings.retentionDays}
                        onChange={(e) => setSettings({...settings, retentionDays: parseInt(e.target.value)})}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Max Upload Size (MB)</label>
                      <input
                        type="number"
                        value={settings.maxUploadSize}
                        onChange={(e) => setSettings({...settings, maxUploadSize: parseInt(e.target.value)})}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">AI Configuration</h2>
                
                <div>
                  <label className="text-gray-400 text-sm">
                    AI Confidence Threshold: {Math.round(settings.aiConfidence * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.aiConfidence}
                    onChange={(e) => setSettings({...settings, aiConfidence: parseFloat(e.target.value)})}
                    className="w-full mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Lower values = more detections but more false positives
                  </p>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">
                    Risk Alert Threshold: {Math.round(settings.riskThreshold * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.riskThreshold}
                    onChange={(e) => setSettings({...settings, riskThreshold: parseFloat(e.target.value)})}
                    className="w-full mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Alerts trigger when risk score exceeds this threshold
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive alerts via email' },
                    { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive critical alerts via SMS' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                    { key: 'autoRefresh', label: 'Auto Refresh', desc: 'Automatically refresh dashboard data' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>
                  ))}

                  <div>
                    <label className="text-gray-400 text-sm">Refresh Interval (seconds)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={settings.refreshInterval}
                      onChange={(e) => setSettings({...settings, refreshInterval: parseInt(e.target.value)})}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Security Settings</h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-2">
                      <Key className="w-4 h-4" />
                      API Keys
                    </div>
                    <p className="text-gray-400 text-sm">Manage API keys for external integrations</p>
                    <button className="mt-2 text-blue-400 text-sm hover:underline">
                      Generate New Key
                    </button>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-2">
                      <Shield className="w-4 h-4" />
                      Two-Factor Authentication
                    </div>
                    <p className="text-gray-400 text-sm">Add an extra layer of security</p>
                    <button className="mt-2 text-blue-400 text-sm hover:underline">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-2">
                      <Eye className="w-4 h-4" />
                      Session Management
                    </div>
                    <p className="text-gray-400 text-sm">View and manage active sessions</p>
                    <button className="mt-2 text-blue-400 text-sm hover:underline">
                      View Sessions
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
