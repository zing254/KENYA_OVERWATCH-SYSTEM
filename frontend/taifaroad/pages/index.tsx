'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import {
  AlertTriangle, MapPin, Phone, Send, CheckCircle, Clock, Shield,
  MessageSquare, Bell, X, Camera, Video, Loader2, AlertCircle, Navigation, Info,
  Car, Zap, Droplets, Mountain, Eye, ChevronDown, ChevronUp, Menu, Home, FileText, Settings, User, LogIn,
  Star, TrendingUp, Radio, Siren, Plus, Globe, HelpCircle,
  Award, Gift, Trophy, Target, Compass, Route, ParkingCircle,
  Newspaper, BookOpen, MessageCircle, Users, SendHorizonal,
  Heart, Share2, Bookmark, ThumbsUp, RefreshCw, Check, Clock3,
  Volume2, Search, Filter, ChevronRight
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// API helper
async function apiCall(endpoint: string, options?: RequestInit) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// Types
interface Report {
  id: string
  type: string
  description: string
  location: string
  status: string
  created_at: string
  points_earned?: number
}

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  location?: string
  created_at: string
}

interface ChatMessage {
  id: string
  user_name: string
  message: string
  timestamp: string
  channel: string
}

interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  published_at: string
  urgent: boolean
}

interface TriviaQuestion {
  id: string
  question: string
  options: string[]
  explanation: string
  points: number
  category: string
}

interface ParkingSpot {
  id: string
  name: string
  available_spaces: number
  total_spaces: number
  hourly_rate_ksh: number
  distance_m: number
  type: string
}

interface TripRoute {
  origin: string
  destination: string
  route: {
    distance_km: number
    estimated_time_min: number
    fuel_cost_ksh: number
  }
  safety_alerts: any[]
  alternative_routes: any[]
}

const REPORT_TYPES = [
  { id: 'accident', label: 'Accident', labelSw: 'Ajali', icon: AlertTriangle, color: 'bg-red-500' },
  { id: 'speeding', label: 'Speeding', labelSw: 'Kasi', icon: Zap, color: 'bg-orange-500' },
  { id: 'reckless', label: 'Reckless', labelSw: 'Hatari', icon: Car, color: 'bg-yellow-500' },
  { id: 'road_hazard', label: 'Hazard', labelSw: 'Hatari', icon: Mountain, color: 'bg-amber-500' },
  { id: 'flooding', label: 'Flooding', labelSw: 'Mafuriko', icon: Droplets, color: 'bg-blue-500' },
  { id: 'other', label: 'Other', labelSw: 'Nyingine', icon: Info, color: 'bg-gray-500' },
]

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Low', labelSw: 'Chini', color: 'text-green-400' },
  { id: 'medium', label: 'Medium', labelSw: 'Wastani', color: 'text-yellow-400' },
  { id: 'high', label: 'High', labelSw: 'Juu', color: 'text-orange-400' },
  { id: 'critical', label: 'Critical', labelSw: 'Hatari', color: 'text-red-400' },
]

export default function CitizenPortal() {
  const [activeTab, setActiveTab] = useState<string>('home')
  const [lang, setLang] = useState<'en' | 'sw'>('en')
  const [mounted, setMounted] = useState(false)
  const [online, setOnline] = useState(true)
  
  // Report form
  const [reportType, setReportType] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Data
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [myReports, setMyReports] = useState<Report[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [triviaQuestions, setTriviaQuestions] = useState<TriviaQuestion[]>([])
  const [currentTrivia, setCurrentTrivia] = useState(0)
  const [triviaAnswer, setTriviaAnswer] = useState<number | null>(null)
  const [triviaResult, setTriviaResult] = useState<any>(null)
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([])
  const [tripRoute, setTripRoute] = useState<TripRoute | null>(null)
  const [tripOrigin, setTripOrigin] = useState('')
  const [tripDestination, setTripDestination] = useState('')
  const [compass, setCompass] = useState<number>(0)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  
  // Profile
  const [profile, setProfile] = useState({
    name: 'John Citizen',
    phone: '+254712345678',
    total_points: 450,
    tier: 'Silver',
    reports_submitted: 12,
    rank: 47,
    streak: 5
  })

  useEffect(() => {
    setMounted(true)
    loadInitialData()
    
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Compass
    if (typeof DeviceOrientationEvent !== 'undefined') {
      window.addEventListener('deviceorientation', (e: any) => {
        if (e.alpha) setCompass(Math.round(e.alpha))
      })
    }
    
    // Poll for updates
    const interval = setInterval(loadAlerts, 30000)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const loadInitialData = async () => {
    await Promise.all([loadAlerts(), loadNews(), loadTrivia(), loadReports()])
  }

  const loadAlerts = async () => {
    const data = await apiCall('/api/alerts')
    if (data) setAlerts(data.alerts || data || [])
  }

  const loadNews = async () => {
    const data = await apiCall('/api/news')
    if (data) setNewsItems(data.news || data || [])
  }

  const loadTrivia = async () => {
    const data = await apiCall('/api/trivia?count=5')
    if (data) setTriviaQuestions(data.questions || [])
  }

  const loadReports = async () => {
    const data = await apiCall('/api/citizen-reports')
    if (data) setMyReports(data.reports || data || [])
  }

  const loadChat = async () => {
    const data = await apiCall('/api/chat/citizen?limit=50')
    if (data) setChatMessages(data.messages || data || [])
  }

  const loadParking = async () => {
    const data = await apiCall('/api/parking/nearby?lat=-1.29&lng=36.82')
    if (data) setParkingSpots(data.parking_spots || data || [])
  }

  const loadTrip = async () => {
    if (!tripOrigin || !tripDestination) return
    const data = await apiCall(`/api/trip/route?origin=${encodeURIComponent(tripOrigin)}&destination=${encodeURIComponent(tripDestination)}`)
    if (data) setTripRoute(data)
  }

  const t = (en: string, sw: string) => lang === 'en' ? en : sw

  const submitReport = async () => {
    if (!reportType || !description || !location) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    setError(null)
    
    const data = await apiCall('/api/citizen-reports/submit', {
      method: 'POST',
      body: JSON.stringify({
        type: reportType,
        description,
        location,
        severity,
      })
    })
    
    if (data) {
      setSuccess(`Report submitted! ID: ${data.id || 'N/A'} - You earned ${data.points_earned || 50} points!`)
      setReportType('')
      setDescription('')
      setLocation('')
      setSeverity('medium')
      setProfile(prev => ({ ...prev, total_points: prev.total_points + 50, reports_submitted: prev.reports_submitted + 1 }))
      loadReports()
      setTimeout(() => setSuccess(null), 5000)
    } else {
      setError('Failed to submit report. Please try again.')
    }
    setSubmitting(false)
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return
    const data = await apiCall('/api/chat/citizen', {
      method: 'POST',
      body: JSON.stringify({ message: chatInput, user_name: profile.name })
    })
    if (data) {
      setChatMessages(prev => [...prev, data])
      setChatInput('')
      setProfile(prev => ({ ...prev, total_points: prev.total_points + 2 }))
    }
  }

  const answerTrivia = async (idx: number) => {
    setTriviaAnswer(idx)
    const question = triviaQuestions[currentTrivia]
    const data = await apiCall('/api/trivia/answer', {
      method: 'POST',
      body: JSON.stringify({ question_id: question.id, selected_index: idx })
    })
    if (data) {
      setTriviaResult(data)
      if (data.correct) {
        setProfile(prev => ({ ...prev, total_points: prev.total_points + data.points_earned }))
      }
    }
  }

  const nextTrivia = () => {
    setCurrentTrivia(prev => (prev + 1) % triviaQuestions.length)
    setTriviaAnswer(null)
    setTriviaResult(null)
  }

  const loadDashboard = () => {
    loadAlerts()
    loadNews()
    loadTrivia()
    loadReports()
  }

  if (!mounted) return null

  const navItems = [
    { id: 'home', label: 'Home', labelSw: 'Nyumbani', icon: Home },
    { id: 'report', label: 'Report', labelSw: 'Ripoti', icon: Send },
    { id: 'alerts', label: 'Alerts', labelSw: 'Tahadhari', icon: Bell },
    { id: 'chat', label: 'Chat', labelSw: 'Mazungumzo', icon: MessageCircle },
    { id: 'news', label: 'News', labelSw: 'Habari', icon: Newspaper },
    { id: 'trivia', label: 'Trivia', labelSw: 'Maswali', icon: HelpCircle },
    { id: 'compass', label: 'Compass', labelSw: 'Dira', icon: Compass },
    { id: 'trip', label: 'Trip', labelSw: 'Safari', icon: Route },
    { id: 'parking', label: 'Parking', labelSw: 'Maegeshi', icon: ParkingCircle },
    { id: 'rewards', label: 'Rewards', labelSw: 'Zawadi', icon: Trophy },
    { id: 'guide', label: 'Guide', labelSw: 'Mwongozo', icon: BookOpen },
    { id: 'myreports', label: 'My Reports', labelSw: 'Ripoti Zangu', icon: FileText },
    { id: 'profile', label: 'Profile', labelSw: 'Wasifu', icon: User },
  ]

  return (
    <>
      <Head>
        <title>MKENYA RSA - Citizen Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <header className="bg-gradient-to-r from-green-800 to-green-900 text-white sticky top-0 z-30 shadow-lg">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-green-300" />
              <div>
                <h1 className="font-bold text-lg leading-tight">MKENYA RSA</h1>
                <p className="text-green-300/70 text-xs">{t('Citizen Portal', 'Lango la Raia')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                {online ? <span className="text-green-400">● Online</span> : <span className="text-red-400 animate-pulse">● Offline</span>}
              </div>
              <button onClick={() => setLang(lang === 'en' ? 'sw' : 'en')} className="px-2 py-1 bg-green-700/50 rounded text-xs flex items-center gap-1">
                <Globe className="w-3 h-3" />{lang === 'en' ? 'SW' : 'EN'}
              </button>
              <button onClick={loadDashboard} className="p-1.5 hover:bg-green-700/50 rounded transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
          <nav className="flex overflow-x-auto scrollbar-none border-t border-green-700/50">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex-1 min-w-[60px] flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] transition-all ${
                  activeTab === item.id ? 'text-white bg-green-700/50 border-b-2 border-green-300' : 'text-green-300/70 hover:text-white'
                }`}>
                <item.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{t(item.label, item.labelSw)}</span>
              </button>
            ))}
          </nav>
        </header>

        <main className="flex-1 overflow-auto p-4">
          {/* HOME */}
          {activeTab === 'home' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-green-400">{profile.total_points}</p>
                  <p className="text-xs text-gray-400">{t('Points', 'Pointi')}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">{profile.reports_submitted}</p>
                  <p className="text-xs text-gray-400">{t('Reports', 'Ripoti')}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-purple-400">{profile.streak}</p>
                  <p className="text-xs text-gray-400">{t('Day Streak', 'Mfululizo')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('report')} className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <Send className="w-8 h-8" /><span className="font-medium text-sm">{t('Report Incident', 'Tuma Ripoti')}</span>
                </button>
                <button onClick={() => setActiveTab('alerts')} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <AlertTriangle className="w-8 h-8" /><span className="font-medium text-sm">{t('View Alerts', 'Tahadhari')}</span>
                </button>
                <button onClick={() => { setActiveTab('chat'); loadChat() }} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <MessageCircle className="w-8 h-8" /><span className="font-medium text-sm">{t('Community Chat', 'Mazungumzo')}</span>
                </button>
                <button onClick={() => setActiveTab('trivia')} className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <HelpCircle className="w-8 h-8" /><span className="font-medium text-sm">{t('Road Trivia', 'Maswali')}</span>
                </button>
              </div>

              {/* Recent Alerts */}
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Bell className="w-4 h-4 text-red-400" />{t('Active Alerts', 'Tahadhari')}
                  </h3>
                  <button onClick={() => setActiveTab('alerts')} className="text-green-400 text-sm">{t('View all', 'Tazama')} →</button>
                </div>
                <div className="divide-y divide-gray-700 max-h-48 overflow-y-auto">
                  {alerts.length > 0 ? alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className="p-3">
                      <div className="flex items-start gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          alert.severity === 'critical' ? 'bg-red-500' : 
                          alert.severity === 'high' ? 'bg-orange-500' : 
                          alert.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        } text-white`}>{alert.severity?.toUpperCase()}</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{alert.title}</p>
                          <p className="text-gray-400 text-xs mt-1">{alert.message}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-gray-500">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                      <p className="text-sm">{t('No active alerts', 'Hakuna tahadhari')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REPORT TAB */}
          {activeTab === 'report' && (
            <div className="space-y-4 animate-fade-in">
              {success && (
                <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400 text-sm">{success}</p>
                </div>
              )}
              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-400 text-sm flex-1">{error}</p>
                  <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400" /></button>
                </div>
              )}

              <div>
                <label className="block text-white font-medium mb-2">{t('What happened?', 'Nini kimetokea?')} *</label>
                <div className="grid grid-cols-2 gap-2">
                  {REPORT_TYPES.map(type => (
                    <button key={type.id} onClick={() => setReportType(type.id)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        reportType === type.id ? 'border-green-500 bg-green-900/30 text-white' : 'border-gray-700 bg-gray-800 text-gray-300'
                      }`}>
                      <type.icon className={`w-5 h-5 mx-auto mb-1 ${reportType === type.id ? 'text-green-400' : 'text-gray-400'}`} />
                      <span className="text-xs block">{t(type.label, type.labelSw)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">{t('Severity', 'Ukali')} *</label>
                <div className="flex gap-2">
                  {SEVERITY_LEVELS.map(s => (
                    <button key={s.id} onClick={() => setSeverity(s.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                        severity === s.id ? `${s.color} bg-gray-700` : 'bg-gray-800 text-gray-400'
                      }`}>
                      {t(s.label, s.labelSw)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">{t('Location', 'Mahali')} *</label>
                <div className="flex gap-2">
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('Enter location or address', 'Weka mahali')}
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500" />
                  <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500">
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">{t('Description', 'Maelezo')} *</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('Describe what you saw...', 'Eleza ulichoona...')}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none" />
              </div>

              <button onClick={submitReport} disabled={submitting || !reportType || !description || !location}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />{t('Submitting...', 'Inatuma...')}</> : <><Send className="w-5 h-5" />{t('Submit Report', 'Tuma Ripoti')}</>}
              </button>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    {t('Community Chat', 'Mazungumzo ya Jamii')}
                  </h3>
                  <p className="text-gray-400 text-xs">Real-time road conditions chat</p>
                </div>
                <div className="h-80 overflow-y-auto p-3 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No messages yet. Start chatting!</p>
                    </div>
                  )}
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="p-2 rounded-lg bg-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-400 text-xs font-medium">{msg.user_name}</span>
                        <span className="text-gray-500 text-[10px]">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-white text-sm">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-gray-700 flex gap-2">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                    placeholder={t('Type a message...', 'Andika ujumbe...')}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none" />
                  <button onClick={sendChatMessage} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500">
                    <SendHorizonal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NEWS TAB */}
          {activeTab === 'news' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-green-400" />
                {t('Road Safety News', 'Habari za Usalama')}
              </h2>
              {newsItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Newspaper className="w-12 h-12 mx-auto mb-2" />
                  <p>Loading news...</p>
                </div>
              )}
              {newsItems.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.urgent && <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded font-medium">URGENT</span>}
                      <span className="px-1.5 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">{item.category}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(item.published_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="text-white font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-300 text-sm">{item.summary}</p>
                  <div className="flex items-center gap-4 mt-3 text-gray-400 text-xs">
                    <button className="flex items-center gap-1 hover:text-white"><ThumbsUp className="w-3 h-3" /> Like</button>
                    <button className="flex items-center gap-1 hover:text-white"><Share2 className="w-3 h-3" /> Share</button>
                    <button className="flex items-center gap-1 hover:text-white"><Bookmark className="w-3 h-3" /> Save</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TRIVIA TAB */}
          {activeTab === 'trivia' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                    {t('Road Safety Trivia', 'Maswali ya Usalama')}
                  </h2>
                  <span className="text-gray-400 text-sm">{currentTrivia + 1}/{triviaQuestions.length}</span>
                </div>
                {triviaQuestions.length > 0 && (
                  <>
                    <p className="text-white text-lg mb-4">{triviaQuestions[currentTrivia]?.question}</p>
                    <div className="space-y-2">
                      {triviaQuestions[currentTrivia]?.options.map((opt, idx) => (
                        <button key={idx} onClick={() => !triviaResult && answerTrivia(idx)}
                          disabled={!!triviaResult}
                          className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                            triviaAnswer === idx
                              ? triviaResult?.correct ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                              : triviaResult && idx === triviaResult.correct_index
                                ? 'bg-green-600/50 text-green-200 border border-green-500'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {triviaResult && (
                      <div className={`mt-4 p-3 rounded-lg ${triviaResult.correct ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                        <p className={`text-sm ${triviaResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                          {triviaResult.correct ? `✓ Correct! +${triviaResult.points_earned} points` : '✗ Incorrect'}
                        </p>
                        <p className="text-gray-300 text-xs mt-2">{triviaResult.explanation}</p>
                        <button onClick={nextTrivia} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                          Next Question →
                        </button>
                      </div>
                    )}
                  </>
                )}
                {triviaQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <HelpCircle className="w-12 h-12 mx-auto mb-2" />
                    <p>Loading trivia questions...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* COMPASS TAB */}
          {activeTab === 'compass' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <h2 className="text-white font-semibold flex items-center justify-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-blue-400" />
                  {t('Compass', 'Dira')}
                </h2>
                <div className="w-48 h-48 mx-auto rounded-full border-4 border-gray-600 flex items-center justify-center relative">
                  <div className="absolute w-1 h-20 bg-red-500 rounded origin-bottom" style={{ transform: `rotate(${compass}deg)` }} />
                  <span className="absolute top-2 text-white font-bold text-sm">N</span>
                  <span className="absolute bottom-2 text-gray-400 text-sm">S</span>
                  <span className="absolute left-2 text-gray-400 text-sm">W</span>
                  <span className="absolute right-2 text-gray-400 text-sm">E</span>
                </div>
                <p className="text-gray-400 text-sm mt-4">Heading: {compass}°</p>
                <p className="text-gray-500 text-xs mt-2">Requires device orientation permission</p>
              </div>
            </div>
          )}

          {/* TRIP PLANNER TAB */}
          {activeTab === 'trip' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Route className="w-5 h-5 text-blue-400" />
                {t('Trip Planner', 'Mpangilio wa Safari')}
              </h2>
              <div className="flex gap-2">
                <input type="text" value={tripOrigin} onChange={(e) => setTripOrigin(e.target.value)}
                  placeholder={t('Origin', 'Mahali pa Kuanzia')}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none" />
                <input type="text" value={tripDestination} onChange={(e) => setTripDestination(e.target.value)}
                  placeholder={t('Destination', 'Mahali pa Kwenda')}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none" />
                <button onClick={loadTrip} className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                  <Search className="w-5 h-5" />
                </button>
              </div>
              {tripRoute && (
                <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <h3 className="text-white font-semibold mb-3">Route Information</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{tripRoute.route.distance_km} km</p>
                      <p className="text-xs text-gray-400">Distance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{tripRoute.route.estimated_time_min} min</p>
                      <p className="text-xs text-gray-400">Est. Time</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">KSh {tripRoute.route.fuel_cost_ksh}</p>
                      <p className="text-xs text-gray-400">Fuel Cost</p>
                    </div>
                  </div>
                  {tripRoute.safety_alerts.length > 0 && (
                    <div>
                      <h4 className="text-white text-sm font-medium mb-2">Safety Alerts</h4>
                      {tripRoute.safety_alerts.map((alert: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-yellow-400 mb-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{alert.type}: {alert.location}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {tripRoute.alternative_routes.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-white text-sm font-medium mb-2">Alternative Routes</h4>
                      {tripRoute.alternative_routes.map((route: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-gray-700 rounded mb-1">
                          <span className="text-white text-sm">{route.name}</span>
                          <div className="text-xs text-gray-400">
                            {route.distance_km}km • {route.time_min}min • Safety: {route.safety_score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* PARKING TAB */}
          {activeTab === 'parking' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ParkingCircle className="w-5 h-5 text-blue-400" />
                  {t('Parking Spaces', 'Maegeshi')}
                </h2>
                <button onClick={loadParking} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              {parkingSpots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <ParkingCircle className="w-12 h-12 mx-auto mb-2" />
                  <p>Loading parking data...</p>
                </div>
              )}
              {parkingSpots.map(spot => (
                <div key={spot.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{spot.name}</h3>
                      <p className="text-gray-400 text-xs capitalize">{spot.type} • {spot.distance_m}m away</p>
                    </div>
                    <span className="text-green-400 font-bold">KSh {spot.hourly_rate_ksh}/hr</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${spot.available_spaces > 10 ? 'text-green-400' : spot.available_spaces > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {spot.available_spaces}
                      </span>
                      <span className="text-gray-400 text-sm">/ {spot.total_spaces} available</span>
                    </div>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">
                      Navigate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* REWARDS TAB */}
          {activeTab === 'rewards' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{profile.tier} Reporter</h2>
                <p className="text-gray-400">Level {Math.floor(profile.total_points / 200) + 1}</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{profile.total_points}</p>
                    <p className="text-xs text-gray-400">Points</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">{profile.reports_submitted}</p>
                    <p className="text-xs text-gray-400">Reports</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">#{profile.rank}</p>
                    <p className="text-xs text-gray-400">Rank</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h3 className="text-white font-semibold mb-3">Ways to Earn Points</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300"><span>Submit report</span><span className="text-green-400">+50 pts</span></div>
                  <div className="flex justify-between text-gray-300"><span>Answer trivia</span><span className="text-green-400">+10 pts</span></div>
                  <div className="flex justify-between text-gray-300"><span>Chat message</span><span className="text-green-400">+2 pts</span></div>
                  <div className="flex justify-between text-gray-300"><span>Daily login</span><span className="text-green-400">+5 pts</span></div>
                </div>
              </div>
            </div>
          )}

          {/* ROAD GUIDE TAB */}
          {activeTab === 'guide' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-400" />
                {t('Road Safety Guide', 'Mwongozo wa Usalama')}
              </h2>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h3 className="text-white font-semibold mb-3">Speed Limits</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between text-gray-300"><span>Urban areas</span><span className="text-yellow-400">50 km/h</span></div>
                  <div className="flex justify-between text-gray-300"><span>Rural roads</span><span className="text-yellow-400">80 km/h</span></div>
                  <div className="flex justify-between text-gray-300"><span>Highways</span><span className="text-yellow-400">110 km/h</span></div>
                  <div className="flex justify-between text-gray-300"><span>School zones</span><span className="text-yellow-400">30 km/h</span></div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h3 className="text-white font-semibold mb-3">Emergency Numbers</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300"><span>Police</span><span className="text-green-400">999 / 112</span></div>
                  <div className="flex justify-between text-gray-300"><span>Ambulance</span><span className="text-green-400">999 / 112</span></div>
                  <div className="flex justify-between text-gray-300"><span>Fire</span><span className="text-green-400">999</span></div>
                  <div className="flex justify-between text-gray-300"><span>NTSA</span><span className="text-green-400">0800 721 638</span></div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h3 className="text-white font-semibold mb-3">Key Traffic Rules</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Wear seatbelts - all occupants</li>
                  <li>• Helmets mandatory for motorcycles</li>
                  <li>• No phone while driving (KSh 2,000 fine)</li>
                  <li>• Stop for pedestrians at crossings</li>
                  <li>• No driving under influence (BAC: 0.08%)</li>
                  <li>• Carry license and insurance</li>
                </ul>
              </div>
            </div>
          )}

          {/* MY REPORTS TAB */}
          {activeTab === 'myreports' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                {t('My Reports', 'Ripoti Zangu')}
              </h2>
              {myReports.map(report => (
                <div key={report.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{report.id}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                        report.status === 'investigating' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{report.status}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm">{report.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-gray-400 text-xs">
                    <MapPin className="w-3 h-3" /> {report.location}
                  </div>
                </div>
              ))}
              {myReports.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2" />
                  <p>No reports yet. Submit your first report!</p>
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <div className="w-20 h-20 bg-green-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{profile.name}</h2>
                <p className="text-gray-400">{profile.phone}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">{profile.tier} Reporter</span>
                </div>
              </div>
              <button className="w-full py-3 bg-gray-800 border border-gray-700 rounded-xl text-gray-400 hover:text-white flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                {t('Sign In for Full Features', 'Ingia kwa Vipengele Vyote')}
              </button>
            </div>
          )}
        </main>

        <footer className="bg-gray-900 border-t border-gray-800 p-3 text-center">
          <p className="text-gray-500 text-xs">MKENYA RSA - Powered by Kenya Overwatch System</p>
          <p className="text-gray-600 text-xs mt-1">© 2026 NTSA Kenya</p>
        </footer>
      </div>
    </>
  )
}
