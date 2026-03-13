'use client'

import Layout from '@/components/Layout'
import { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Terminal,
  FileText,
  Database,
  Server,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Eye,
  Play,
  Pause
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface LogEntry {
  id: string
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error' | 'critical'
  category: string
  source: string
  message: string
  details?: Record<string, unknown>
  user_id?: string
  ip_address?: string
  request_id?: string
}

const LOG_LEVELS = ['all', 'debug', 'info', 'warning', 'error', 'critical']
const LOG_CATEGORIES = ['all', 'api', 'auth', 'database', 'security', 'incident', 'violation', 'websocket', 'system']

const mockLogs: LogEntry[] = [
  { id: '1', timestamp: '2024-03-13T22:24:42Z', level: 'info', category: 'api', source: '/api/incidents', message: 'GET request to /api/incidents completed', details: { status: 200, duration: '45ms' }, request_id: 'req_abc123' },
  { id: '2', timestamp: '2024-03-13T22:24:41Z', level: 'warning', category: 'security', source: 'auth.py', message: 'Failed login attempt for user admin@overwatch.go.ke', details: { attempts: 3, ip: '192.168.1.105' }, ip_address: '192.168.1.105', request_id: 'req_def456' },
  { id: '3', timestamp: '2024-03-13T22:24:40Z', level: 'error', category: 'database', source: 'database.py', message: 'Connection timeout to PostgreSQL', details: { database: 'overwatch_db', timeout: '30s' }, request_id: 'req_ghi789' },
  { id: '4', timestamp: '2024-03-13T22:24:39Z', level: 'info', category: 'incident', source: 'incident_service.py', message: 'New incident created: INC-2024-00123', details: { incident_id: 'inc_001', type: 'accident', severity: 'high' }, user_id: 'officer_001', request_id: 'req_jkl012' },
  { id: '5', timestamp: '2024-03-13T22:24:38Z', level: 'debug', category: 'websocket', source: 'websocket_manager.py', message: 'WebSocket connection established', details: { client_id: 'ws_client_001', channels: ['incidents', 'alerts'] }, request_id: 'req_mno345' },
  { id: '6', timestamp: '2024-03-13T22:24:37Z', level: 'critical', category: 'security', source: 'auth.py', message: 'Multiple failed authentication attempts detected', details: { attempts: 10, ip: '10.0.0.55', username: 'root' }, ip_address: '10.0.0.55', request_id: 'req_pqr678' },
  { id: '7', timestamp: '2024-03-13T22:24:36Z', level: 'info', category: 'violation', source: 'anpr_api.py', message: 'Speed violation detected on Mombasa Road', details: { plate: 'KAA 123A', speed: '120 km/h', limit: '100 km/h' }, request_id: 'req_stu901' },
  { id: '8', timestamp: '2024-03-13T22:24:35Z', level: 'warning', category: 'system', source: 'cache.py', message: 'Redis cache memory usage above 80%', details: { usage: '85%', max_memory: '2GB' }, request_id: 'req_vwx234' },
  { id: '9', timestamp: '2024-03-13T22:24:34Z', level: 'info', category: 'api', source: '/api/teams', message: 'POST request to /api/teams/dispatch', details: { status: 201, team_id: 'team_001', incident_id: 'inc_001' }, user_id: 'dispatch_001', request_id: 'req_yza567' },
  { id: '10', timestamp: '2024-03-13T22:24:33Z', level: 'debug', category: 'auth', source: 'auth.py', message: 'JWT token validated successfully', details: { user_id: 'officer_002', expires_in: '3600s' }, user_id: 'officer_002', request_id: 'req_bcd890' },
]

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('1h')
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showDetails, setShowDetails] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.request_id?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter
    
    return matchesSearch && matchesLevel && matchesCategory
  })

  const stats = {
    total: logs.length,
    critical: logs.filter(l => l.level === 'critical').length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
    info: logs.filter(l => l.level === 'info').length,
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'info': return <Info className="w-4 h-4 text-blue-400" />
      default: return <Terminal className="w-4 h-4 text-gray-400" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-600 text-white'
      case 'error': return 'bg-red-500 text-white'
      case 'warning': return 'bg-yellow-500 text-black'
      case 'info': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'api': return <FileText className="w-4 h-4" />
      case 'auth': return <Shield className="w-4 h-4" />
      case 'database': return <Database className="w-4 h-4" />
      case 'security': return <Shield className="w-4 h-4" />
      case 'incident': return <AlertTriangle className="w-4 h-4" />
      case 'violation': return <Activity className="w-4 h-4" />
      case 'websocket': return <Server className="w-4 h-4" />
      default: return <Terminal className="w-4 h-4" />
    }
  }

  const refreshLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (levelFilter !== 'all') params.append('level', levelFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      params.append('limit', '100')
      
      const res = await fetch(`${API_URL}/api/logs?${params}`).catch(() => null)
      if (res?.ok) {
        const data = await res.json()
        setLogs(data.logs || mockLogs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    refreshLogs()
  }, [levelFilter, categoryFilter])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshLogs, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const exportLogs = () => {
    const csv = [
      ['Timestamp', 'Level', 'Category', 'Source', 'Message', 'Request ID', 'User ID', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.source,
        `"${log.message.replace(/"/g, '""')}"`,
        log.request_id || '',
        log.user_id || '',
        log.ip_address || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('en-KE', { 
      timeZone: 'Africa/Nairobi',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Layout title="System Logs - KENYA OVERWATCH">
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Terminal className="w-4 h-4" />
              Total
            </div>
            <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <XCircle className="w-4 h-4 text-red-500" />
              Critical
            </div>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.critical}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <XCircle className="w-4 h-4 text-red-400" />
              Errors
            </div>
            <p className="text-2xl font-bold text-red-400 mt-1">{stats.errors}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Warnings
            </div>
            <p className="text-2xl font-bold text-yellow-400 mt-1">{stats.warnings}</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Info className="w-4 h-4 text-blue-400" />
              Info
            </div>
            <p className="text-2xl font-bold text-blue-400 mt-1">{stats.info}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              {LOG_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level === 'all' ? 'All Levels' : level.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              {LOG_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="15m">Last 15 minutes</option>
              <option value="1h">Last 1 hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {autoRefresh ? 'Live' : 'Paused'}
            </button>

            <button
              onClick={refreshLogs}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportLogs}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-gray-300">
                        {getCategoryIcon(log.category)}
                        <span className="text-sm capitalize">{log.category}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                      {log.source}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-md truncate">
                      {log.message}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                      {log.request_id || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedLog(log); setShowDetails(true) }}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(log, null, 2))}
                          className="p-1 hover:bg-gray-700 rounded transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No logs found matching your filters</p>
            </div>
          )}

          <div className="px-4 py-3 border-t border-gray-700 bg-gray-700/30">
            <p className="text-sm text-gray-400">
              Showing {filteredLogs.length} of {logs.length} logs
            </p>
          </div>
        </div>

        {/* Log Details Modal */}
        {showDetails && selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetails(false)}>
            <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white">Log Details</h2>
                <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-white">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Timestamp</label>
                    <p className="text-white font-mono text-sm">{selectedLog.timestamp}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Level</label>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(selectedLog.level)}`}>
                      {selectedLog.level.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Category</label>
                    <p className="text-white capitalize">{selectedLog.category}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Source</label>
                    <p className="text-white font-mono text-sm">{selectedLog.source}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Request ID</label>
                    <p className="text-white font-mono text-sm">{selectedLog.request_id || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">User ID</label>
                    <p className="text-white font-mono text-sm">{selectedLog.user_id || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-400">Message</label>
                    <p className="text-white">{selectedLog.message}</p>
                  </div>
                  {selectedLog.details && (
                    <div className="col-span-2">
                      <label className="text-xs text-gray-400">Details</label>
                      <pre className="bg-gray-900 p-3 rounded-lg text-gray-300 text-xs overflow-x-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-end gap-2">
                <button
                  onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2))}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div ref={logsEndRef} />
      </div>
    </Layout>
  )
}