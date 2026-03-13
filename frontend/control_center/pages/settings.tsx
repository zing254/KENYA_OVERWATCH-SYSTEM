'use client'

import { useState, useEffect, useCallback } from 'react'
import Layout from '@/components/Layout'
import { 
  Settings, Save, Server, Database, Shield, Bell, Eye, Key, Activity, CheckCircle, XCircle,
  Camera, Volume2, Zap, AlertTriangle, Car, User, Target, Flame, Wifi, MapPin, Clock,
  VolumeX, Video, Mic, Radio, RefreshCw, RotateCcw
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface SystemStatus {
  ai_pipeline: string
  risk_engine: string
  evidence_manager: string
  camera_streams: string
  database: string
  alert_system: string
}

interface SettingsData {
  ai: {
    confidence_threshold: number
    risk_threshold: number
    detect_persons: boolean
    detect_vehicles: boolean
    detect_license_plates: boolean
    detect_faces: boolean
    detect_fire: boolean
  }
  alerts: {
    critical_alerts: boolean
    traffic_alerts: boolean
    vehicle_of_interest_alerts: boolean
    person_alerts: boolean
    camera_offline_alerts: boolean
    dispatch_alerts: boolean
  }
  audio: {
    sound_enabled: boolean
    voice_alerts: boolean
    radio_simulation: boolean
    alert_volume: number
    voice_volume: number
  }
  notifications: {
    email_enabled: boolean
    sms_enabled: boolean
    push_enabled: boolean
    auto_refresh: boolean
    refresh_interval: number
  }
  map: {
    map_type: string
    auto_refresh: boolean
    refresh_interval: number
    show_satellite: boolean
    show_routes: boolean
    gps_tracking: boolean
  }
  cameras: {
    default_resolution: string
    default_fps: number
    motion_detection: boolean
    night_vision: boolean
    ptz_enabled: boolean
  }
  system: {
    retention_days: number
    max_upload_size: number
    maintenance_mode: boolean
  }
}

const defaultSettings: SettingsData = {
  ai: {
    confidence_threshold: 0.7,
    risk_threshold: 0.7,
    detect_persons: true,
    detect_vehicles: true,
    detect_license_plates: true,
    detect_faces: true,
    detect_fire: true,
  },
  alerts: {
    critical_alerts: true,
    traffic_alerts: true,
    vehicle_of_interest_alerts: true,
    person_alerts: true,
    camera_offline_alerts: true,
    dispatch_alerts: true,
  },
  audio: {
    sound_enabled: true,
    voice_alerts: true,
    radio_simulation: true,
    alert_volume: 80,
    voice_volume: 70,
  },
  notifications: {
    email_enabled: true,
    sms_enabled: true,
    push_enabled: true,
    auto_refresh: true,
    refresh_interval: 30,
  },
  map: {
    map_type: 'standard',
    auto_refresh: true,
    refresh_interval: 10,
    show_satellite: true,
    show_routes: true,
    gps_tracking: true,
  },
  cameras: {
    default_resolution: '720p',
    default_fps: 30,
    motion_detection: true,
    night_vision: true,
    ptz_enabled: true,
  },
  system: {
    retention_days: 90,
    max_upload_size: 10,
    maintenance_mode: false,
  }
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system')
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState<SettingsData>(defaultSettings)

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
        database: 'mock_data',
        alert_system: 'operational'
      })
    }
    setLoading(false)
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`)
      const data = await res.json()
      if (data && Object.keys(data).length > 0) {
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const categories = ['ai', 'alerts', 'audio', 'notifications', 'map', 'cameras', 'system']
      for (const category of categories) {
        await fetch(`${API_URL}/api/settings/${category}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings[category as keyof SettingsData])
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
    }
    setSaving(false)
  }

  const handleReset = async () => {
    try {
      await fetch(`${API_URL}/api/settings/reset`, { method: 'POST' })
      setSettings(defaultSettings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error resetting settings:', error)
    }
  }

  const updateSetting = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const tabs = [
    { id: 'system', label: 'System', icon: Server },
    { id: 'ai', label: 'AI Detection', icon: Activity },
    { id: 'cameras', label: 'Cameras', icon: Camera },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'map', label: 'Map', icon: MapPin },
  ]

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-600'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-0.5'
      }`} />
    </button>
  )

  return (
    <Layout title="Kenya Overwatch - Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-gray-400">Configure system preferences</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
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
                        value={settings.system.retention_days}
                        onChange={(e) => updateSetting('system', 'retention_days', parseInt(e.target.value))}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Max Upload Size (MB)</label>
                      <input
                        type="number"
                        value={settings.system.max_upload_size}
                        onChange={(e) => updateSetting('system', 'max_upload_size', parseInt(e.target.value))}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  AI Detection Configuration
                </h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-300">Detection Types</h3>
                  {[
                    { key: 'detect_persons', label: 'Person Detection', icon: User, desc: 'Detect and track persons' },
                    { key: 'detect_vehicles', label: 'Vehicle Detection', icon: Car, desc: 'Detect vehicles on road' },
                    { key: 'detect_license_plates', label: 'License Plate Recognition', icon: Target, desc: 'ANPR for plate detection' },
                    { key: 'detect_faces', label: 'Face Detection', icon: Eye, desc: 'Facial recognition' },
                    { key: 'detect_fire', label: 'Fire & Smoke Detection', icon: Flame, desc: 'Fire and smoke alerts' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch 
                        enabled={settings.ai[item.key as keyof typeof settings.ai]} 
                        onChange={() => updateSetting('ai', item.key, !settings.ai[item.key as keyof typeof settings.ai])}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-300 mb-4">Confidence Thresholds</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">
                        AI Confidence Threshold: {Math.round(settings.ai.confidence_threshold * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.ai.confidence_threshold}
                        onChange={(e) => updateSetting('ai', 'confidence_threshold', parseFloat(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">
                        Risk Threshold: {Math.round(settings.ai.risk_threshold * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={settings.ai.risk_threshold}
                        onChange={(e) => updateSetting('ai', 'risk_threshold', parseFloat(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cameras' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Camera Settings
                </h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'ptz_enabled', label: 'PTZ Control', desc: 'Enable pan/tilt/zoom controls' },
                    { key: 'motion_detection', label: 'Motion Detection', desc: 'Trigger recording on motion' },
                    { key: 'night_vision', label: 'Night Vision Mode', desc: 'Enable IR mode for low light' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <ToggleSwitch 
                        enabled={settings.cameras[item.key as keyof typeof settings.cameras]} 
                        onChange={() => updateSetting('cameras', item.key, !settings.cameras[item.key as keyof typeof settings.cameras])}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Default Stream Quality</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Resolution</label>
                      <select
                        value={settings.cameras.default_resolution}
                        onChange={(e) => updateSetting('cameras', 'default_resolution', e.target.value)}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="480p">480p (SD)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="1080p">1080p (Full HD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Frame Rate</label>
                      <select
                        value={settings.cameras.default_fps}
                        onChange={(e) => updateSetting('cameras', 'default_fps', parseInt(e.target.value))}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="15">15 FPS</option>
                        <option value="24">24 FPS</option>
                        <option value="30">30 FPS</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alert Settings
                </h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'critical_alerts', label: 'Critical Incidents', desc: 'High severity alerts', icon: Zap },
                    { key: 'traffic_alerts', label: 'Traffic Violations', desc: 'Speed & red light violations', icon: Car },
                    { key: 'vehicle_of_interest_alerts', label: 'Vehicle of Interest', desc: 'Flagged vehicle re-identification', icon: Target },
                    { key: 'person_alerts', label: 'Person Alerts', desc: 'Unknown person detection', icon: User },
                    { key: 'camera_offline_alerts', label: 'Camera Offline', desc: 'When cameras go offline', icon: Video },
                    { key: 'dispatch_alerts', label: 'Dispatch Alerts', desc: 'Team dispatch notifications', icon: Bell },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-orange-400" />
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch 
                        enabled={settings.alerts[item.key as keyof typeof settings.alerts]} 
                        onChange={() => updateSetting('alerts', item.key, !settings.alerts[item.key as keyof typeof settings.alerts])}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Audio Settings
                </h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'sound_enabled', label: 'Sound Alerts', desc: 'Play sound for alerts', icon: Volume2 },
                    { key: 'voice_alerts', label: 'Voice Announcements', desc: 'TTS voice alerts', icon: Mic },
                    { key: 'radio_simulation', label: 'Radio Simulation', desc: 'Simulated radio calls', icon: Radio },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">{item.label}</p>
                          <p className="text-gray-400 text-sm">{item.desc}</p>
                        </div>
                      </div>
                      <ToggleSwitch 
                        enabled={settings.audio[item.key as keyof typeof settings.audio]} 
                        onChange={() => updateSetting('audio', item.key, !settings.audio[item.key as keyof typeof settings.audio])}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Volume Controls</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">Alert Volume: {settings.audio.alert_volume}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.audio.alert_volume}
                        onChange={(e) => updateSetting('audio', 'alert_volume', parseInt(e.target.value))}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Voice Volume: {settings.audio.voice_volume}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.audio.voice_volume}
                        onChange={(e) => updateSetting('audio', 'voice_volume', parseInt(e.target.value))}
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Map Settings
                </h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'auto_refresh', label: 'Auto Refresh', desc: 'Automatically update map' },
                    { key: 'show_satellite', label: 'Satellite View', desc: 'Show satellite imagery option' },
                    { key: 'show_routes', label: 'Route Navigation', desc: 'Show navigation routes' },
                    { key: 'gps_tracking', label: 'GPS Tracking', desc: 'Track responder locations' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <ToggleSwitch 
                        enabled={settings.map[item.key as keyof typeof settings.map]} 
                        onChange={() => updateSetting('map', item.key, !settings.map[item.key as keyof typeof settings.map])}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Default Map View</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm">Map Type</label>
                      <select
                        value={settings.map.map_type}
                        onChange={(e) => updateSetting('map', 'map_type', e.target.value)}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="standard">Standard</option>
                        <option value="satellite">Satellite</option>
                        <option value="dark">Dark</option>
                        <option value="terrain">Terrain</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Refresh Interval (seconds)</label>
                      <input
                        type="number"
                        min="5"
                        max="60"
                        value={settings.map.refresh_interval}
                        onChange={(e) => updateSetting('map', 'refresh_interval', parseInt(e.target.value))}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
                
                <div className="space-y-4">
                  {[
                    { key: 'email_enabled', label: 'Email Notifications', desc: 'Receive alerts via email' },
                    { key: 'sms_enabled', label: 'SMS Notifications', desc: 'Receive critical alerts via SMS' },
                    { key: 'push_enabled', label: 'Push Notifications', desc: 'Browser push notifications' },
                    { key: 'auto_refresh', label: 'Auto Refresh', desc: 'Automatically refresh dashboard data' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <ToggleSwitch 
                        enabled={settings.notifications[item.key as keyof typeof settings.notifications]} 
                        onChange={() => updateSetting('notifications', item.key, !settings.notifications[item.key as keyof typeof settings.notifications])}
                      />
                    </div>
                  ))}

                  <div>
                    <label className="text-gray-400 text-sm">Refresh Interval (seconds)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={settings.notifications.refresh_interval}
                      onChange={(e) => updateSetting('notifications', 'refresh_interval', parseInt(e.target.value))}
                      className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    />
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
