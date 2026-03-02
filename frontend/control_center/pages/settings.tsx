'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { 
  Settings, Save, Server, Database, Shield, Bell, Eye, Key, Activity, CheckCircle, XCircle,
  Camera, Volume2, Zap, AlertTriangle, Car, User, Target, Flame, Wifi, MapPin, Clock,
  VolumeX, Video, Mic, Radio, MessageSquare
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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('system')
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)

  const [settings, setSettings] = useState({
    // AI Settings
    aiConfidence: 0.7,
    riskThreshold: 0.7,
    detectPersons: true,
    detectVehicles: true,
    detectWeapons: true,
    detectLicensePlates: true,
    detectFaces: true,
    detectFire: true,
    detectAnimals: true,
    detectAbandoned: true,
    
    // Camera Settings
    defaultResolution: '720p',
    defaultFps: 30,
    motionDetection: true,
    nightVision: true,
    ptzEnabled: true,
    mobileTestEnabled: true,
    
    // Alert Settings
    criticalAlerts: true,
    trafficAlerts: true,
    vehicleOfInterestAlerts: true,
    personAlerts: true,
    cameraOfflineAlerts: true,
    dispatchAlerts: true,
    
    // Audio Settings
    soundEnabled: true,
    voiceAlerts: true,
    radioSimulation: true,
    alertVolume: 80,
    voiceVolume: 70,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    autoRefresh: true,
    refreshInterval: 30,
    
    // Map Settings
    mapType: 'standard',
    autoRefreshMap: true,
    mapRefreshInterval: 10,
    showSatellite: true,
    showRoutes: true,
    gpsTracking: true,
    
    // System Settings
    maxUploadSize: 10,
    retentionDays: 90,
    maintenanceMode: false,
    debugMode: false,
  })

  const [detectionSettings, setDetectionSettings] = useState({
    personMinConfidence: 0.6,
    vehicleMinConfidence: 0.7,
    plateMinConfidence: 0.8,
    weaponMinConfidence: 0.9,
    faceMinConfidence: 0.75,
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
    { id: 'ai', label: 'AI Detection', icon: Activity },
    { id: 'cameras', label: 'Cameras', icon: Camera },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'audio', label: 'Audio', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'map', label: 'Map', icon: MapPin },
    { id: 'security', label: 'Security', icon: Shield },
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
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  AI Detection Configuration
                </h2>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-300">Detection Types</h3>
                  {[
                    { key: 'detectPersons', label: 'Person Detection', icon: User, desc: 'Detect and track persons' },
                    { key: 'detectVehicles', label: 'Vehicle Detection', icon: Car, desc: 'Detect vehicles on road' },
                    { key: 'detectLicensePlates', label: 'License Plate Recognition', icon: Target, desc: 'ANPR for plate detection' },
                    { key: 'detectWeapons', label: 'Weapon Detection', icon: Zap, desc: 'Detect weapons and dangerous items' },
                    { key: 'detectFaces', label: 'Face Detection', icon: Eye, desc: 'Facial recognition' },
                    { key: 'detectFire', label: 'Fire & Smoke Detection', icon: Flame, desc: 'Fire and smoke alerts' },
                    { key: 'detectAnimals', label: 'Animal Detection', icon: Target, desc: 'Detect animals on road' },
                    { key: 'detectAbandoned', label: 'Abandoned Object Detection', icon: AlertTriangle, desc: 'Detect suspicious objects' },
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
                        enabled={settings[item.key as keyof typeof settings] as boolean} 
                        onChange={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-gray-300 mb-4">Confidence Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: 'personMinConfidence', label: 'Person Detection', value: detectionSettings.personMinConfidence },
                      { key: 'vehicleMinConfidence', label: 'Vehicle Detection', value: detectionSettings.vehicleMinConfidence },
                      { key: 'plateMinConfidence', label: 'License Plate', value: detectionSettings.plateMinConfidence },
                      { key: 'weaponMinConfidence', label: 'Weapon Detection', value: detectionSettings.weaponMinConfidence },
                      { key: 'faceMinConfidence', label: 'Face Detection', value: detectionSettings.faceMinConfidence },
                    ].map(item => (
                      <div key={item.key}>
                        <label className="text-gray-400 text-sm">{item.label}: {Math.round(item.value * 100)}%</label>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.05"
                          value={item.value}
                          onChange={(e) => setDetectionSettings({...detectionSettings, [item.key]: parseFloat(e.target.value)})}
                          className="w-full mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm">
                    Global AI Confidence Threshold: {Math.round(settings.aiConfidence * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.aiConfidence}
                    onChange={(e) => setSettings({...settings, aiConfidence: parseFloat(e.target.value)})}
                    className="w-full mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Lower = more detections but more false positives | Higher = fewer false positives but may miss some detections
                  </p>
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
                    { key: 'ptzEnabled', label: 'PTZ Control', desc: 'Enable pan/tilt/zoom controls' },
                    { key: 'mobileTestEnabled', label: 'Mobile Test Cameras', desc: 'Allow MOBILE-TEST camera label' },
                    { key: 'motionDetection', label: 'Motion Detection', desc: 'Trigger recording on motion' },
                    { key: 'nightVision', label: 'Night Vision Mode', desc: 'Enable IR mode for low light' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <ToggleSwitch 
                        enabled={settings[item.key as keyof typeof settings] as boolean} 
                        onChange={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
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
                        value={settings.defaultResolution}
                        onChange={(e) => setSettings({...settings, defaultResolution: e.target.value})}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="480p">480p (SD)</option>
                        <option value="720p">720p (HD)</option>
                        <option value="1080p">1080p (Full HD)</option>
                        <option value="4k">4K (Ultra HD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Frame Rate</label>
                      <select
                        value={settings.defaultFps}
                        onChange={(e) => setSettings({...settings, defaultFps: parseInt(e.target.value)})}
                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="15">15 FPS</option>
                        <option value="24">24 FPS</option>
                        <option value="30">30 FPS</option>
                        <option value="60">60 FPS</option>
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
                    { key: 'criticalAlerts', label: 'Critical Incidents', desc: 'High severity alerts', icon: Zap },
                    { key: 'trafficAlerts', label: 'Traffic Violations', desc: 'Speed & red light violations', icon: Car },
                    { key: 'vehicleOfInterestAlerts', label: 'Vehicle of Interest', desc: 'Flagged vehicle re-identification', icon: Target },
                    { key: 'personAlerts', label: 'Person Alerts', desc: 'Unknown person detection', icon: User },
                    { key: 'cameraOfflineAlerts', label: 'Camera Offline', desc: 'When cameras go offline', icon: Video },
                    { key: 'dispatchAlerts', label: 'Dispatch Alerts', desc: 'Team dispatch notifications', icon: Bell },
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
                        enabled={settings[item.key as keyof typeof settings] as boolean} 
                        onChange={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-gray-400 text-sm">
                    Risk Alert Threshold: {Math.round(settings.riskThreshold * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={settings.riskThreshold}
                    onChange={(e) => setSettings({...settings, riskThreshold: parseFloat(e.target.value)})}
                    className="w-full mt-2"
                  />
                  <p className="text-gray-500 text-sm mt-1">
                    Only trigger alerts when risk score exceeds this threshold
                  </p>
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
                    { key: 'soundEnabled', label: 'Sound Alerts', desc: 'Play sound for alerts', icon: Volume2 },
                    { key: 'voiceAlerts', label: 'Voice Announcements', desc: 'TTS voice alerts', icon: Mic },
                    { key: 'radioSimulation', label: 'Radio Simulation', desc: 'Simulated radio calls', icon: Radio },
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
                        enabled={settings[item.key as keyof typeof settings] as boolean} 
                        onChange={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Volume Controls</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm">Alert Volume: {settings.alertVolume}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.alertVolume}
                        onChange={(e) => setSettings({...settings, alertVolume: parseInt(e.target.value)})}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm">Voice Volume: {settings.voiceVolume}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.voiceVolume}
                        onChange={(e) => setSettings({...settings, voiceVolume: parseInt(e.target.value)})}
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
                    { key: 'autoRefreshMap', label: 'Auto Refresh', desc: 'Automatically update map' },
                    { key: 'showSatellite', label: 'Satellite View', desc: 'Show satellite imagery option' },
                    { key: 'showRoutes', label: 'Route Navigation', desc: 'Show navigation routes' },
                    { key: 'gpsTracking', label: 'GPS Tracking', desc: 'Track responder locations' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between bg-gray-700/50 rounded-lg p-4">
                      <div>
                        <p className="text-white font-medium">{item.label}</p>
                        <p className="text-gray-400 text-sm">{item.desc}</p>
                      </div>
                      <ToggleSwitch 
                        enabled={settings[item.key as keyof typeof settings] as boolean} 
                        onChange={() => setSettings({...settings, [item.key]: !settings[item.key as keyof typeof settings]})}
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
                        value={settings.mapType}
                        onChange={(e) => setSettings({...settings, mapType: e.target.value})}
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
                        value={settings.mapRefreshInterval}
                        onChange={(e) => setSettings({...settings, mapRefreshInterval: parseInt(e.target.value)})}
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
