'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import {
  AlertTriangle, MapPin, Phone, Send, CheckCircle, Clock, Shield,
  MessageSquare, ChevronRight, Bell, Search, X, Camera, Video,
  Upload, Trash2, Loader2, AlertCircle, Navigation, Info,
  Car, Zap, Droplets, Mountain, Eye, Volume2, VolumeX,
  ChevronDown, ChevronUp, Menu, Home, FileText, Settings, User, LogIn,
  Star, TrendingUp, Radio, Siren, Cross, Globe, HelpCircle,
  Award, Gift, Trophy, Target, Compass, Route, ParkingCircle,
  Newspaper, BookOpen, MessageCircle, Users, SendHorizonal,
  Heart, Share2, Bookmark, ThumbsUp
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// Types
interface Report {
  id: string
  type: string
  description: string
  location: string
  status: string
  created_at: string
}

interface Alert {
  id: string
  title: string
  message: string
  severity: string
  location?: string
  created_at: string
}

interface UserProfile {
  phone: string
  name: string
  reports_count: number
  points: number
  badge: string
  level: number
  streak: number
}

interface TriviaQuestion {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
}

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: string
  type: 'citizen' | 'system'
}

interface NewsItem {
  id: string
  title: string
  summary: string
  category: string
  published_at: string
  urgent: boolean
}

// Constants
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

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  { id: 'q1', question: 'What is the speed limit in urban areas in Kenya?', options: ['30 km/h', '50 km/h', '60 km/h', '80 km/h'], correct: 1, explanation: 'The speed limit in urban areas in Kenya is 50 km/h.' },
  { id: 'q2', question: 'What is the emergency number for police in Kenya?', options: ['112', '911', '999', 'Both 999 and 112'], correct: 3, explanation: 'Both 999 and 112 are emergency numbers in Kenya.' },
  { id: 'q3', question: 'Is wearing a seatbelt mandatory for all car occupants?', options: ['Only for driver', 'Only front seats', 'All occupants', 'Only on highways'], correct: 2, explanation: 'Seatbelts are mandatory for ALL occupants.' },
  { id: 'q4', question: 'What side of the road do Kenyans drive on?', options: ['Right', 'Left', 'Either', 'Depends'], correct: 1, explanation: 'Kenya drives on the LEFT side of the road.' },
  { id: 'q5', question: 'What is the BAC limit for drivers in Kenya?', options: ['0.05%', '0.08%', '0.10%', 'Zero'], correct: 1, explanation: 'The BAC limit in Kenya is 0.08%.' },
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'System', message: 'Welcome to the Kenya Road Safety Community Chat!', timestamp: new Date().toISOString(), type: 'system' },
    { id: '2', user: 'John K.', message: 'Heavy traffic on Mombasa Road near JKIA', timestamp: new Date(Date.now() - 60000).toISOString(), type: 'citizen' },
    { id: '3', user: 'Mary W.', message: 'Accident cleared on Thika Road', timestamp: new Date(Date.now() - 120000).toISOString(), type: 'citizen' },
  ])
  const [chatInput, setChatInput] = useState('')
  const [newsItems, setNewsItems] = useState<NewsItem[]>([
    { id: 'n1', title: 'New AI Cameras Deployed on Major Highways', summary: 'NTSA deploys 700+ AI-powered cameras for automated traffic enforcement...', category: 'Enforcement', published_at: new Date().toISOString(), urgent: true },
    { id: 'n2', title: 'Instant Fines System Now Active', summary: 'Pay traffic fines within 7 days via M-Pesa, KCB, or eCitizen...', category: 'Policy', published_at: new Date().toISOString(), urgent: false },
    { id: 'n3', title: 'Road Safety Week Campaign', summary: 'Join the nationwide road safety awareness campaign...', category: 'Campaign', published_at: new Date().toISOString(), urgent: false },
  ])
  
  // Gamification
  const [profile, setProfile] = useState<UserProfile>({
    phone: '+254712345678', name: 'John Citizen', reports_count: 12,
    points: 450, badge: 'Silver Reporter', level: 3, streak: 5
  })
  const [triviaIndex, setTriviaIndex] = useState(0)
  const [triviaAnswer, setTriviaAnswer] = useState<number | null>(null)
  const [triviaResult, setTriviaResult] = useState<string | null>(null)
  const [compass, setCompass] = useState<number>(0)
  
  // Navigation
  const navItems = [
    { id: 'home', label: 'Home', labelSw: 'Nyumbani', icon: Home },
    { id: 'report', label: 'Report', labelSw: 'Ripoti', icon: Send },
    { id: 'alerts', label: 'Alerts', labelSw: 'Tahadhari', icon: Bell },
    { id: 'chat', label: 'Chat', labelSw: 'Mazungumzo', icon: MessageCircle },
    { id: 'news', label: 'News', labelSw: 'Habari', icon: Newspaper },
    { id: 'trivia', label: 'Trivia', labelSw: 'Maswali', icon: HelpCircle },
    { id: 'compass', label: 'Compass', labelSw: 'Dira', icon: Compass },
    { id: 'rewards', label: 'Rewards', labelSw: 'Zawadi', icon: Trophy },
    { id: 'guide', label: 'Road Guide', labelSw: 'Mwongozo', icon: BookOpen },
    { id: 'myreports', label: 'My Reports', labelSw: 'Ripoti Zangu', icon: FileText },
    { id: 'profile', label: 'Profile', labelSw: 'Wasifu', icon: User },
  ]

  useEffect(() => {
    setMounted(true)
    // Monitor online status
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Load compass heading if supported
    if ('DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', (e: any) => {
        if (e.alpha) setCompass(Math.round(e.alpha))
      })
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const t = (en: string, sw: string) => lang === 'en' ? en : sw
  const isEnglish = lang === 'en'

  const submitReport = async () => {
    if (!reportType || !description || !location) {
      setError('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const newReport: Report = {
        id: `RPT-${Date.now()}`,
        type: reportType,
        description,
        location,
        status: 'pending',
        created_at: new Date().toISOString()
      }
      setMyReports(prev => [newReport, ...prev])
      setProfile(prev => ({ ...prev, reports_count: prev.reports_count + 1, points: prev.points + 50 }))
      setSuccess('Report submitted successfully! +50 points')
      setReportType('')
      setDescription('')
      setLocation('')
      setTimeout(() => setSuccess(null), 5000)
    } catch (e) {
      setError('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  const sendChatMessage = () => {
    if (!chatInput.trim()) return
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      user: profile.name,
      message: chatInput,
      timestamp: new Date().toISOString(),
      type: 'citizen'
    }
    setChatMessages(prev => [msg, ...prev])
    setChatInput('')
    setProfile(prev => ({ ...prev, points: prev.points + 5 }))
  }

  const answerTrivia = (idx: number) => {
    setTriviaAnswer(idx)
    const question = TRIVIA_QUESTIONS[triviaIndex]
    if (idx === question.correct) {
      setTriviaResult('correct')
      setProfile(prev => ({ ...prev, points: prev.points + 20 }))
    } else {
      setTriviaResult('incorrect')
    }
  }

  const nextTrivia = () => {
    setTriviaIndex(prev => (prev + 1) % TRIVIA_QUESTIONS.length)
    setTriviaAnswer(null)
    setTriviaResult(null)
  }

  if (!mounted) return null

  return (
    <>
      <Head>
        <title>MKENYA RSA - Citizen Portal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-900 flex flex-col">
        {/* Header */}
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
            </div>
          </div>
          
          {/* Navigation */}
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

        {/* Content */}
        <main className="flex-1 overflow-auto p-4">
          {/* Home Tab */}
          {activeTab === 'home' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-green-400">{profile.points}</p>
                  <p className="text-xs text-gray-400">{t('Points', 'Pointi')}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-yellow-400">{profile.reports_count}</p>
                  <p className="text-xs text-gray-400">{t('Reports', 'Ripoti')}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                  <p className="text-2xl font-bold text-purple-400">{profile.streak}</p>
                  <p className="text-xs text-gray-400">{t('Day Streak', 'Siku Mfululizo')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('report')} className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <Send className="w-8 h-8" /><span className="font-medium text-sm">{t('Report Incident', 'Tuma Ripoti')}</span>
                </button>
                <button onClick={() => setActiveTab('alerts')} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <AlertTriangle className="w-8 h-8" /><span className="font-medium text-sm">{t('View Alerts', 'Tahadhari')}</span>
                </button>
                <button onClick={() => setActiveTab('chat')} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <MessageCircle className="w-8 h-8" /><span className="font-medium text-sm">{t('Community Chat', 'Mazungumzo')}</span>
                </button>
                <button onClick={() => setActiveTab('trivia')} className="bg-purple-600 hover:bg-purple-500 text-white p-4 rounded-xl flex flex-col items-center gap-2 transition-all active:scale-95">
                  <HelpCircle className="w-8 h-8" /><span className="font-medium text-sm">{t('Road Trivia', 'Maswali')}</span>
                </button>
              </div>

              {/* Recent News */}
              <div className="bg-gray-800 rounded-xl border border-gray-700">
                <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                  <h3 className="font-semibold text-white flex items-center gap-2"><Newspaper className="w-4 h-4 text-green-400" />{t('Latest News', 'Habari Mpya')}</h3>
                  <button onClick={() => setActiveTab('news')} className="text-green-400 text-sm">{t('View all', 'Tazama zote')} →</button>
                </div>
                {newsItems.slice(0, 2).map(item => (
                  <div key={item.id} className="p-3 border-b border-gray-700 last:border-b-0">
                    <div className="flex items-start gap-2">
                      {item.urgent && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] rounded">URGENT</span>}
                      <div>
                        <p className="text-white text-sm font-medium">{item.title}</p>
                        <p className="text-gray-400 text-xs mt-1">{item.summary}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Tab */}
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
                  <p className="text-red-400 text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-400" /></button>
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
                      className={`flex-1 py-2 rounded-lg text-sm font-medium ${
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
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />{t('Submitting...', 'Inatuma...')}</> : <><Send className="w-5 h-5" />{t('Submit Report', 'Tuma Ripoti')}</>}
              </button>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-400" />
                    {t('Community Chat', 'Mazungumzo ya Jamii')}
                  </h3>
                  <p className="text-gray-400 text-xs">Chat with other citizens about road conditions</p>
                </div>
                <div className="h-80 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg ${msg.type === 'system' ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-gray-700'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-green-400 text-xs font-medium">{msg.user}</span>
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

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-green-400" />
                {t('Road Safety News', 'Habari za Usalama')}
              </h2>
              {newsItems.map(item => (
                <div key={item.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.urgent && <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded font-medium">URGENT</span>}
                      <span className="px-2 py-0.5 bg-gray-700 text-gray-300 text-xs rounded">{item.category}</span>
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

          {/* Trivia Tab */}
          {activeTab === 'trivia' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                    {t('Road Safety Trivia', 'Maswali ya Usalama')}
                  </h2>
                  <span className="text-gray-400 text-sm">{triviaIndex + 1}/{TRIVIA_QUESTIONS.length}</span>
                </div>
                <p className="text-white text-lg mb-4">{TRIVIA_QUESTIONS[triviaIndex].question}</p>
                <div className="space-y-2">
                  {TRIVIA_QUESTIONS[triviaIndex].options.map((opt, idx) => (
                    <button key={idx} onClick={() => !triviaResult && answerTrivia(idx)}
                      disabled={!!triviaResult}
                      className={`w-full p-3 rounded-lg text-left text-sm transition-all ${
                        triviaAnswer === idx
                          ? triviaResult === 'correct' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                          : triviaResult && idx === TRIVIA_QUESTIONS[triviaIndex].correct
                            ? 'bg-green-600/50 text-green-200 border border-green-500'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}>
                      {opt}
                    </button>
                  ))}
                </div>
                {triviaResult && (
                  <div className={`mt-4 p-3 rounded-lg ${triviaResult === 'correct' ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                    <p className={`text-sm ${triviaResult === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                      {triviaResult === 'correct' ? '✓ Correct! +20 points' : '✗ Incorrect'}
                    </p>
                    <p className="text-gray-300 text-xs mt-2">{TRIVIA_QUESTIONS[triviaIndex].explanation}</p>
                    <button onClick={nextTrivia} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500">
                      Next Question →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compass Tab */}
          {activeTab === 'compass' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <h2 className="text-white font-semibold flex items-center justify-center gap-2 mb-4">
                  <Compass className="w-5 h-5 text-blue-400" />
                  {t('Compass & Navigation', 'Dira na Urambazaji')}
                </h2>
                <div className="w-48 h-48 mx-auto rounded-full border-4 border-gray-600 flex items-center justify-center relative">
                  <div className="absolute w-1 h-20 bg-red-500 rounded" style={{ transform: `rotate(${compass}deg)`, transformOrigin: 'bottom center' }} />
                  <span className="absolute top-2 text-white font-bold text-sm">N</span>
                  <span className="absolute bottom-2 text-gray-400 text-sm">S</span>
                  <span className="absolute left-2 text-gray-400 text-sm">W</span>
                  <span className="absolute right-2 text-gray-400 text-sm">E</span>
                </div>
                <p className="text-gray-400 text-sm mt-4">Heading: {compass}°</p>
                <p className="text-gray-500 text-xs mt-2">Rotate your device to see the compass in action</p>
              </div>
            </div>
          )}

          {/* Rewards Tab */}
          {activeTab === 'rewards' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 text-center">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{profile.badge}</h2>
                <p className="text-gray-400">Level {profile.level}</p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">{profile.points}</p>
                    <p className="text-xs text-gray-400">Points</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-400">{profile.reports_count}</p>
                    <p className="text-xs text-gray-400">Reports</p>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">#{Math.floor(Math.random() * 100) + 1}</p>
                    <p className="text-xs text-gray-400">Rank</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h3 className="text-white font-semibold mb-3">Ways to Earn Points</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300"><span>Submit incident report</span><span className="text-green-400">+50 pts</span></div>
                  <div className="flex justify-between text-gray-300"><span>Answer trivia correctly</span><span className="text-green-400">+20 pts</span></div>
                  <div className="flex justify-between text-gray-300"><span>Stream dashcam footage</span><span className="text-green-400">+100 pts/hr</span></div>
                  <div className="flex justify-between text-gray-300"><span>Daily login streak</span><span className="text-green-400">+10 pts</span></div>
                  <div className="flex justify-between text-gray-300"><span>Community chat message</span><span className="text-green-400">+5 pts</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Road Guide Tab */}
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
                  <div className="flex justify-between text-gray-300"><span>NTSA</span><span className="text-green-400">0800721638</span></div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <h3 className="text-white font-semibold mb-3">Key Traffic Rules</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Always wear seatbelts (all occupants)</li>
                  <li>• Helmets mandatory for all motorcycle riders and passengers</li>
                  <li>• Never use phone while driving (KSh 2,000 fine)</li>
                  <li>• Stop for pedestrians at crossings</li>
                  <li>• No driving under the influence (BAC limit: 0.08%)</li>
                  <li>• Carry valid driving license and insurance</li>
                </ul>
              </div>
            </div>
          )}

          {/* My Reports Tab */}
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

          {/* Profile Tab */}
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
                  <span className="text-yellow-400 font-medium">{profile.badge}</span>
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
