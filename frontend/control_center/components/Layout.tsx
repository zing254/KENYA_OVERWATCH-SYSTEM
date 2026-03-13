'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import { 
  Shield, Home, Video, AlertTriangle, Users, Bell, BarChart3, 
  Settings, LogOut, Menu, X, Map, FileText, Car, Activity,
  ChevronDown, Search, User, Send, MapPin, TrendingUp, Radio,
  MessageCircle, Terminal
} from 'lucide-react'
import ChatPanel from './ChatPanel'
import NotificationPanel from './NotificationPanel'
import useAuthStore from '@/store/auth'

interface LayoutProps {
  children: ReactNode
  title?: string
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/cameras', label: 'Speed Cams', icon: Video },
  { href: '/satellite', label: 'Satellite', icon: Map },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/dispatch', label: 'Dispatch', icon: Radio },
  { href: '/citizen-reports', label: 'Citizen Reports', icon: MessageCircle },
  { href: '/chat', label: 'Team Chat', icon: MessageCircle },
  { href: '/logs', label: 'System Logs', icon: Terminal },
  { href: '/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/county-analysis', label: 'County Analysis', icon: MapPin },
  { href: '/settings', label: 'Settings', icon: Settings },
]

const Layout = ({ children, title = 'KENYA OVERWATCH SYSTEM - Command Center' }: LayoutProps) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="KENYA OVERWATCH SYSTEM - Road Safety Command Center" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex">
        {/* Sidebar - KENYA OVERWATCH Theme */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gradient-to-b from-ntsa-primaryDark to-gray-900 border-r border-ntsa-primaryLight/30 flex flex-col transition-all duration-300 fixed h-full z-30`}>
          {/* Logo - KENYA OVERWATCH Branding */}
          <div className="p-4 border-b border-ntsa-primaryLight/30 flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-ntsa-primaryLight" />
                <div>
                  <h1 className="text-white font-bold text-sm">KENYA OVERWATCH</h1>
                  <p className="text-ntsa-primaryLight/70 text-xs">Command Center</p>
                </div>
              </div>
            )}
            {!sidebarOpen && <Shield className="w-8 h-8 text-ntsa-primaryLight mx-auto" />}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = router.pathname === item.href || (item.href !== '/' && router.pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                    isActive
                      ? 'bg-ntsa-primary text-white border-l-2 border-ntsa-primaryLight'
                      : 'text-gray-400 hover:bg-ntsa-primaryDark/50 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
          {/* Top header - NTSA Theme */}
          <header className="bg-gradient-to-r from-ntsa-primaryDark to-gray-900 border-b border-ntsa-primaryLight/30 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-ntsa-primary/50 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Search */}
              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search plate, location, incident..."
                  className="bg-black/30 border border-ntsa-primaryLight/30 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-ntsa-primaryLight w-80"
                />
              </div>
              {/* Mobile search icon */}
              <button className="lg:hidden p-2 hover:bg-ntsa-primary/50 rounded-lg text-gray-400">
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Status indicator - NTSA Theme */}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-ntsa-primaryLight rounded-full animate-pulse"></span>
                <span className="text-ntsa-primaryLight">System Online</span>
              </div>

              {/* Chat */}
              <ChatPanel />

              {/* Notifications */}
              <NotificationPanel />

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-ntsa-primary/50 rounded-lg"
                >
                  <div className="w-8 h-8 bg-ntsa-primaryLight rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm hidden md:block">Officer</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1">
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white">
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:bg-gray-700 hover:text-white">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <hr className="border-gray-700 my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700">
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}

export default Layout
