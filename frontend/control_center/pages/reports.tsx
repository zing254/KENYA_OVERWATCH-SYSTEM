import Layout from '@/components/Layout'
import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar, Download, Filter } from 'lucide-react'

export default function Reports() {
  const [reportType, setReportType] = useState('incidents')
  const [dateRange, setDateRange] = useState('week')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    loadReport()
  }, [reportType, dateRange])

  const loadReport = async () => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/api/analytics/trends?period=${dateRange}&metric=${reportType}`)
      const data = await response.json()
      setReportData(data)
    } catch (error) {
      console.error('Error loading report:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (format: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/export/${reportType}?format=${format}&limit=1000`)
      const data = await response.json()
      
      if (format === 'csv' && data.data) {
        const blob = new Blob([data.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
      }
    } catch (error) {
      console.error('Error exporting report:', error)
    }
  }

  const reportTypes = [
    { id: 'incidents', label: 'Incident Reports', description: 'All incident data and statistics' },
    { id: 'evidence', label: 'Evidence Reports', description: 'Evidence package statistics' },
    { id: 'alerts', label: 'Alert Reports', description: 'Alert and notification statistics' },
    { id: 'performance', label: 'Performance Reports', description: 'System performance metrics' }
  ]

  const dateRanges = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' }
  ]

  return (
    <Layout title="Kenya Overwatch - Reports">
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
              <p className="text-blue-200">Generate and export system reports</p>
            </div>
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-800 rounded-lg font-medium hover:bg-blue-50"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-wrap gap-4">
              {/* Report Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <div className="flex gap-2">
                  {reportTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        reportType === type.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex gap-2">
                  {dateRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => setDateRange(range.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        dateRange === range.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Report Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold">{reportData?.data_points?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trend</p>
                  <p className={`text-2xl font-bold ${reportData?.trend === 'increasing' ? 'text-red-600' : 'text-green-600'}`}>
                    {reportData?.trend || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Period</p>
                  <p className="text-2xl font-bold capitalize">{reportData?.period || dateRange}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Filter className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Change</p>
                  <p className="text-2xl font-bold">
                    {reportData?.change_percentage ? `${reportData.change_percentage > 0 ? '+' : ''}${reportData.change_percentage}%` : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {reportTypes.find(t => t.id === reportType)?.label} Trend
            </h2>
            
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="h-64 flex items-end gap-2">
                {reportData?.data_points?.map((point: any, index: number) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${(point.value / 100) * 200}px` }}
                    ></div>
                    <p className="text-xs text-gray-500 mt-2 truncate">
                      {new Date(point.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Forecast Section */}
          {reportData?.forecast && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Forecast</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.forecast.map((item: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Prediction {index + 1}</p>
                    <p className="text-2xl font-bold">{item.predicted}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
