'use client'

import { useState } from 'react'
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
  ChevronRight
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Report {
  id?: string
  type: string
  description: string
  location: string
  latitude?: number
  longitude?: number
  contact_name: string
  contact_phone: string
  anonymous: boolean
}

export default function CitizenPortal() {
  const [report, setReport] = useState<Report>({
    type: 'emergency',
    description: '',
    location: '',
    contact_name: '',
    contact_phone: '',
    anonymous: false
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reportId, setReportId] = useState('')

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
              contact_name: '',
              contact_phone: '',
              anonymous: false
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
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4" />
            <span>Emergency: 999</span>
          </div>
        </div>
      </header>

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
              <p className="text-sm text-gray-500 mb-4">Your contact information (optional)</p>
              
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text"
                      value={report.contact_name}
                      onChange={(e) => setReport(prev => ({ ...prev, contact_name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={report.contact_phone}
                      onChange={(e) => setReport(prev => ({ ...prev, contact_phone: e.target.value }))}
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
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        <p>Kenya Overwatch Production System</p>
        <p>Government of Kenya</p>
      </footer>
    </div>
  )
}
