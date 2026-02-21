import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useState } from 'react'
import { 
  Shield, Home, Video, AlertTriangle, Users, Bell, BarChart3, 
  Settings, LogOut, Menu, X, Map, FileText, Car, Activity,
  ChevronDown, Search, User, Send
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  title?: string
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/cameras', label: 'Cameras', icon: Video },
  { href: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { href: '/dispatch', label: 'Dispatch', icon: Send },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/map', label: 'Map', icon: Map },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/offences', label: 'Offences', icon: Car },
  { href: '/reports', label: 'Reports', icon: FileText },
]

const Layout = ({ children, title = 'Kenya Overwatch Production' }: LayoutProps) => {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Kenya Overwatch Production System - Real-time AI Surveillance & Risk Management" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="min-h-screen bg-gray-900 flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300 fixed h-full z-30`}>
          {/* Logo */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-blue-400" />
                <div>
                  <h1 className="text-white font-bold text-sm">Kenya Overwatch</h1>
                  <p className="text-gray-400 text-xs">Production System</p>
                </div>
              </div>
            )}
            {!sidebarOpen && <Shield className="w-8 h-8 text-blue-400 mx-auto" />}
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
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-2 border-t border-gray-700">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
              title={!sidebarOpen ? 'Settings' : undefined}
            >
              <Settings className="w-5 h-5" />
              {sidebarOpen && <span className="text-sm">Settings</span>}
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className={`flex-1 flex flex-col ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300`}>
          {/* Top header */}
          <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 w-64"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-gray-400">System Online</span>
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-lg"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm hidden md:block">Admin</span>
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
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700">
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
