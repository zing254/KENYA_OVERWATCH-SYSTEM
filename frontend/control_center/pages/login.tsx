'use client'

import { useState } from 'react'
import { useRouter } from 'next/router'
import { Shield, Lock, User, AlertCircle } from 'lucide-react'
import useAuthStore from '@/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/api/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      })

      if (response.ok) {
        const data = await response.json()
        login(
          {
            id: data.user_id || data.id || '1',
            name: data.name || username,
            email: data.email || `${username}@ntsa.go.ke`,
            role: data.role || (username.includes('admin') ? 'admin' : username.includes('dispatch') ? 'dispatcher' : 'officer'),
            badge_number: data.badge_number,
            station: data.station,
          },
          data.access_token || 'demo-token'
        )
        router.push('/')
      } else {
        setError('Invalid username or password')
      }
    } catch {
      // Fallback to demo mode for development
      if (username && password) {
        login(
          {
            id: '1',
            name: username,
            email: `${username}@ntsa.go.ke`,
            role: username.includes('admin') ? 'admin' : username.includes('dispatch') ? 'dispatcher' : 'officer',
          },
          'demo-token'
        )
        router.push('/')
      } else {
        setError('Please enter username and password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Kenya Overwatch</h1>
          <p className="text-gray-400">Control Center Login</p>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Demo accounts:</p>
          <p>admin / any password - Admin access</p>
          <p>dispatch / any password - Dispatch access</p>
          <p>officer / any password - Officer access</p>
        </div>
      </div>
    </div>
  )
}
