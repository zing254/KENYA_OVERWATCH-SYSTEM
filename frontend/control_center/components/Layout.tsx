'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useState, useEffect, useCallback } from 'react'
import { 
  Shield, Home, Video, AlertTriangle, Users, Bell, BarChart3, 
  Settings, LogOut, Menu, X, Map, FileText, Car, Activity,
  ChevronDown, Search, User, Send, MapPin, TrendingUp, Radio,
  MessageCircle, Terminal, Bus, Globe, HelpCircle, Keyboard,
  Wifi, WifiOff
} from 'lucide-react'
import ChatPanel from './ChatPanel'
import KenyaFooter from './KenyaFooter'
import NotificationPanel from './NotificationPanel'
import KenyaOverwatchLogo from './KenyaOverwatchLogo'
import useAuthStore from '@/store/auth'
import { t } from '@/utils/i18n'
import { useLocale } from '@/hooks/useLocale'

interface LayoutProps {
  children: ReactNode
  title?: string
}

interface NavItem {
  href: string
  labelKey: string
  label: string
  icon: any
  badge?: number
  tooltip: string
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'dashboard', label: 'Dashboard', icon: Home, tooltip: 'Main overview of road safety metrics and alerts' },
  { href: '/cameras', labelKey: 'cameras', label: 'Speed Cams', icon: Video, tooltip: 'Live camera feeds, speed detection, and ANPR' },
  { href: '/satellite', labelKey: 'satellite', label: 'Satellite', icon: Map, tooltip: 'Satellite imagery analysis for road conditions and hazards' },
  { href: '/psv-routes', labelKey: 'psv_routes', label: 'PSV Routes', icon: Bus, tooltip: 'Matatu routes, SACCOs, stages, and fare information' },
  { href: '/vehicles', labelKey: 'vehicles', label: 'Vehicles', icon: Car, tooltip: 'Vehicle registry with Kenyan plate classification' },
  { href: '/dispatch', labelKey: 'dispatch', label: 'Dispatch', icon: Radio, tooltip: 'Emergency dispatch with proximity-based team selection' },
  { href: '/citizen-reports', labelKey: 'citizen_reports', label: 'Citizen Reports', icon: MessageCircle, tooltip: 'Reports submitted by citizens via mobile app' },
  { href: '/chat', labelKey: 'team_chat', label: 'Team Chat', icon: MessageCircle, tooltip: 'Real-time communication between response teams' },
  { href: '/analytics', labelKey: 'analytics', label: 'Analytics', icon: TrendingUp, tooltip: 'Traffic patterns, trends, and safety analytics' },
  { href: '/reports', labelKey: 'reports', label: 'Reports', icon: FileText, tooltip: 'Generate and export safety reports' },
  { href: '/county-analysis', labelKey: 'county_analysis', label: 'County Analysis', icon: MapPin, tooltip: 'Road safety analysis by county with weather and congestion data' },
  { href: '/logs', labelKey: 'logs', label: 'System Logs', icon: Terminal, tooltip: 'System activity logs and audit trail' },
  { href: '/settings', labelKey: 'settings', label: 'Settings', icon: Settings, tooltip: 'System configuration and preferences' },
]

// Tooltip component
function Tooltip({ children, text, position = 'right' }: { children: ReactNode; text: string; position?: 'right' | 'bottom' }) {
  const [show, setShow] = useState(false)
  
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className={`absolute z-50 px-3 py-2 text-xs text-white bg-gray-800 border border-gray-600 rounded-lg shadow-xl whitespace-nowrap animate-fade-in ${
          position === 'right' ? 'left-full ml-2 top-1/2 -translate-y-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
        }`}>
          {text}
          <div className={`absolute w-2 h-2 bg-gray-800 border-l border-b border-gray-600 transform rotate-45 ${
            position === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : '-top-1 left-1/2 -translate-x-1/2'
          }`} />
        </div>
      )}
    </div>
  )
}

// Connection status indicator
function ConnectionStatus() {
  const [online, setOnline] = useState(true)
  const [lastPing, setLastPing] = useState<Date | null>(null)

  useEffect(() => {
    const checkConnection = () => {
      setOnline(navigator.onLine)
      if (navigator.onLine) setLastPing(new Date())
    }
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => {
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
      clearInterval(interval)
    }
  }, [])

  return (
    <Tooltip text={online ? `Connected${lastPing ? ` (last check: ${lastPing.toLocaleTimeString()})` : ''}` : 'No internet connection'}>
      <div className="flex items-center gap-2 text-sm cursor-help">
        {online ? (
          <>
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 hidden sm:inline">Offline</span>
          </>
        )}
      </div>
    </Tooltip>
  )
}

// System time display
function SystemTime() {
  const [time, setTime] = useState<string>('')
  
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Tooltip text="East Africa Time (EAT)">
      <span className="text-gray-400 text-xs font-mono cursor-help hidden md:block">{time} EAT</span>
    </Tooltip>
  )
}

const Layout = ({ children, title = 'KENYA OVERWATCH SYSTEM - Command Center' }: LayoutProps) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const { logout } = useAuthStore()
  const { lang, toggleLang } = useLocale()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setUserMenuOpen(false)
  }, [router.pathname])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          document.getElementById('global-search')?.focus()
        }
      }
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setSearchQuery('')
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        setSidebarOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = useCallback(() => {
    logout()
    router.push('/login')
  }, [logout, router])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/vehicles?search=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, router])

  if (!mounted) return null

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="KENYA OVERWATCH SYSTEM - Real-time Road Safety Monitoring" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#1a1a2e" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64 translate-x-0' : 'w-16 -translate-x-full lg:translate-x-0'} bg-gradient-to-b from-gray-900 via-gray-900 to-black border-r border-green-900/30 flex flex-col transition-all duration-300 fixed h-full z-30 lg:relative`}>
          {/* Logo */}
          <div className="p-4 border-b border-green-900/30 flex items-center justify-between">
            {sidebarOpen ? (
              <KenyaOverwatchLogo size="sm" showText={true} />
            ) : (
              <Tooltip text="KENYA OVERWATCH System" position="right">
                <KenyaOverwatchLogo size="sm" showText={false} className="mx-auto" />
              </Tooltip>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 hover:bg-green-900/30 rounded-lg text-gray-400 hover:text-white transition-colors lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            {navItems.map((item, index) => {
              const isActive = router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href))
              return (
                <Tooltip key={item.href} text={item.tooltip} position="right">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group ${
                      isActive
                        ? 'bg-green-600/20 text-green-400 border-l-2 border-green-400 shadow-lg shadow-green-900/20'
                        : 'text-gray-400 hover:bg-gray-800/50 hover:text-white hover:border-l-2 hover:border-gray-600'
                    }`}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                    {sidebarOpen && (
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    )}
                    {sidebarOpen && item.badge && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </Tooltip>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          {sidebarOpen && (
            <div className="p-3 border-t border-green-900/30">
              <div className="text-xs text-gray-500 text-center">
                <p>v2.0.0</p>
                <p className="text-green-500/50">Kenya Overwatch</p>
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className="bg-gray-900/95 backdrop-blur-sm border-b border-green-900/30 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-green-900/30 rounded-lg text-gray-400 hover:text-white transition-all duration-200 active:scale-95"
                title={`${sidebarOpen ? 'Hide' : 'Show'} sidebar (Ctrl+B)`}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Search */}
              <form onSubmit={handleSearch} className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="global-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plate, location, incident..."
                  className="bg-gray-800/50 border border-gray-700 rounded-lg pl-10 pr-16 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 w-64 lg:w-80 transition-all duration-200"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-gray-500 bg-gray-700/50 rounded border border-gray-600">/</kbd>
              </form>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* System time */}
              <SystemTime />

              {/* Connection status */}
              <ConnectionStatus />

              {/* Chat */}
              <ChatPanel />

              {/* Notifications */}
              <NotificationPanel />

              {/* User menu */}
              <div className="relative">
                <Tooltip text="Account menu">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 hover:bg-green-900/30 rounded-lg transition-all duration-200 active:scale-95"
                  >
                    <div className="w-8 h-8 bg-green-600/30 rounded-full flex items-center justify-center ring-2 ring-green-500/20">
                      <User className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white text-sm hidden lg:block">Officer</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </Tooltip>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-2 z-50 animate-slide-down">
                      <div className="px-4 py-2 border-b border-gray-700 mb-1">
                        <p className="text-white font-medium text-sm">Officer</p>
                        <p className="text-gray-400 text-xs">admin@kenyaoverwatch.go.ke</p>
                      </div>
                      <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <Link href="/logs" className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                        <Terminal className="w-4 h-4" /> Activity Log
                      </Link>
                      <hr className="border-gray-700 my-1" />
                      <Tooltip text="Keyboard shortcuts" position="bottom">
                        <div className="flex items-center gap-2 px-4 py-2 text-gray-400 text-xs">
                          <Keyboard className="w-3 h-3" />
                          <span>Ctrl+B: Toggle sidebar</span>
                        </div>
                      </Tooltip>
                      <hr className="border-gray-700 my-1" />
                      <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-900/30 transition-colors">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Language toggle */}
              <Tooltip text={lang === 'en' ? 'Switch to Kiswahili' : 'Switch to English'}>
                <button
                  onClick={toggleLang}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-700 rounded-lg text-xs text-gray-300 bg-gray-800/50 hover:bg-gray-700 hover:border-green-500/50 transition-all duration-200 active:scale-95"
                >
                  <Globe className="w-3 h-3" />
                  <span className="hidden sm:inline">{lang === 'en' ? 'EN' : 'SW'}</span>
                </button>
              </Tooltip>
            </div>
          </header>

          {/* Page content with animation */}
          <main className="flex-1 overflow-auto">
            <div className="animate-fade-in">
              {children}
            </div>
            <KenyaFooter />
          </main>
        </div>
      </div>
    </>
  )
}

export default Layout
