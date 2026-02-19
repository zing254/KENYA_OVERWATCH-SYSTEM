'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Send, 
  CheckCircle, 
  Clock, 
  Shield,
  MessageSquare,
  ChevronRight,
  Bell,
  Search,
  X,
  Info
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Report {
  id?: string
  type: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  anonymous: boolean
  first_name: string
  last_name: string
  phone_number: string
  phone: string
}

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  created_at: string
}

export default function CitizenPortal() {
  const [report, setReport] = useState<Report>({
    type: 'emergency',
    description: '',
    location: '',
    anonymous: false,
    first_name: '',
    last_name: '',
    phone_number: '',
    phone: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportId, setReportId] = useState('')
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showAlerts, setShowAlerts] = useState(false)
  const [checkStatus, setCheckStatus] = useState('')
  const [reportStatus, setReportStatus] = useState<any>(null)

  const reportTypes = [
    { id: 'emergency', label: 'Emergency', icon: '🚨', color: 'bg-red-500' },
    { id: 'crime', label: 'Crime', icon: '⚠️', color: 'bg-orange-500' },
    { id: 'accident', label: 'Accident', icon: '🚗', color: 'bg-yellow-500' },
    { id: 'fire', label: 'Fire', icon: '🔥', color: 'bg-red-600' },
    { id: 'medical', label: 'Medical', icon: '🏥', color: 'bg-blue-500' },
    { id: 'suspicious', label: 'Suspicious Activity', icon: '👁️', color: 'bg-purple-500' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/citizen/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      })

      if (response.ok) {
        const data = await response.json()
        setReportId(data.report?.id || data.id || 'Unknown')
        setSubmitted(true)
      } else {
        setError('Failed to submit report. Please try again.')
      }
    } catch (err) {
      console.error('Error submitting report:', err)
      setError('Could not connect to server. Please check your connection.')
    }

    setLoading(false)
  }

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setReport(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          }))
        },
        (err) => {
          setError('Could not get location. Please enter manually.')
        }
      )
    }
  }

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_URL}/api/notifications`).catch(() => ({ json: () => ({ notifications: [] }) }))
        const data = await res.json()
        setAlerts(data.notifications?.slice(0, 10) || [])
      } catch (err) {
        console.error('Error fetching alerts:', err)
      }
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkReportStatus = async () => {
    if (!checkStatus) return
    try {
      const res = await fetch(`${API_URL}/api/citizen/reports/${checkStatus}`).catch(() => ({ json: () => null }))
      const data = await res.json()
      setReportStatus(data)
    } catch (err) {
      setReportStatus({ error: 'Could not fetch status' })
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-4">Your report has been received and is being processed.</p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">Reference Number</p>
            <p className="text-xl font-mono font-bold text-blue-600">{reportId}</p>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Response time: ~5-10 minutes</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Your report is confidential</span>
            </div>
          </div>
          <button
            onClick={() => { setSubmitted(false); setReport({
              type: 'emergency',
              description: '',
              location: '',
              anonymous: false,
              first_name: '',
              last_name: '',
              phone_number: '',
              phone: ''
            })}}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Submit Another Report
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Kenya Overwatch - Citizen Report</title>
        <meta name="description" content="Report emergencies to Kenya Overwatch" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold">Kenya Overwatch</h1>
              <p className="text-xs text-blue-200">Citizen Emergency Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowAlerts(!showAlerts)}
              className="relative p-2 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{alerts.length}</span>
              )}
            </button>
            <div className="text-sm flex items-center gap-1">
              <Phone className="w-4 h-4" />
              <span>999</span>
            </div>
          </div>
        </div>
      </header>

      {showAlerts && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-yellow-800 flex items-center gap-2"><Bell className="w-4 h-4" /> Public Alerts</h3>
              <button onClick={() => setShowAlerts(false)} className="text-yellow-600 hover:text-yellow-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-sm text-yellow-700">No active alerts in your area</p>
              ) : (
                alerts.map(alert => (
                  <div key={alert.id} className={`p-3 rounded-lg text-sm ${
                    alert.severity === 'critical' ? 'bg-red-100 border border-red-300' :
                    alert.severity === 'high' ? 'bg-orange-100 border border-orange-300' :
                    'bg-yellow-100 border border-yellow-300'
                  }`}>
                    <div className="font-medium text-gray-900">{alert.title}</div>
                    <div className="text-gray-600">{alert.message}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Report an Emergency</h2>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">What type of emergency?</label>
              <div className="grid grid-cols-3 gap-2">
                {reportTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setReport(prev => ({ ...prev, type: type.id }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      report.type === type.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{type.icon}</span>
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what happened
              </label>
              <textarea
                value={report.description}
                onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide as much detail as possible..."
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={report.location}
                  onChange={(e) => setReport(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location or use GPS"
                  required
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={getLocation}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  GPS
                </button>
              </div>
              {report.latitude && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Location captured: {report.latitude.toFixed(4)}, {report.longitude?.toFixed(4)}
                </p>
              )}
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-500 mb-4">Your information</p>
              
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={report.anonymous}
                  onChange={(e) => setReport(prev => ({ ...prev, anonymous: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="anonymous" className="text-sm text-gray-600">
                  Submit anonymously
                </label>
              </div>

              {!report.anonymous && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={report.first_name}
                        onChange={(e) => setReport(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="First name"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={report.last_name}
                        onChange={(e) => setReport(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Last name"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={report.phone_number}
                      onChange={(e) => setReport(prev => ({ ...prev, phone_number: e.target.value }))}
                      placeholder="07XX XXX XXX"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>Submitting...</>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Emergency Report
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3">
          <MessageSquare className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">Need help?</h3>
            <p className="text-sm text-blue-700">
              For immediate assistance, call 999. This portal is for non-life-threatening reports.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-bold text-gray-900">Check Report Status</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={checkStatus}
              onChange={(e) => setCheckStatus(e.target.value)}
              placeholder="Enter your report reference number"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={checkReportStatus}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Check
            </button>
          </div>
          {reportStatus && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              {reportStatus.error ? (
                <p className="text-red-600">{reportStatus.error}</p>
              ) : (
                <div>
                  <p className="font-medium">Status: <span className="text-blue-600">{reportStatus.status || 'Unknown'}</span></p>
                  <p className="text-sm text-gray-600 mt-1">Reference: {reportStatus.id}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        <p>Kenya Overwatch Production System</p>
        <p>Government of Kenya</p>
      </footer>
    </div>
  )
}
