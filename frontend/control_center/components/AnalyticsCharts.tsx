'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, TrendingDown, AlertTriangle, Activity, 
  Users, Car, MapPin, Clock, Calendar, Download,
  BarChart3, PieChart, LineChart, AreaChart
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, AreaChart as RechartsArea, Area,
  LineChart as RechartsLine, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ScatterChart, Scatter, Legend
} from 'recharts'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface AnalyticsChartProps {
  title: string
  timeRange?: '24h' | '7d' | '30d' | '90d'
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6']

export function RiskAnalysisChart({ title, timeRange = '7d' }: AnalyticsChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    setData([
      { road: 'Mombasa Rd', risk: 85, accidents: 45, severity: 78 },
      { road: 'Thika Hwy', risk: 72, accidents: 38, severity: 65 },
      { road: 'Ngong Rd', risk: 68, accidents: 32, severity: 58 },
      { road: 'Kenyatta Ave', risk: 55, accidents: 25, severity: 45 },
      { road: 'Nakuru Rd', risk: 48, accidents: 18, severity: 38 },
      { road: 'Eldoret Rd', risk: 42, accidents: 15, severity: 32 },
    ])
  }, [timeRange])

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-red-400" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis dataKey="road" type="category" stroke="#9ca3af" width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#fff' }}
          />
          <Bar dataKey="risk" fill="#ef4444" radius={[0, 4, 4, 0]} name="Risk Score" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TimeSeriesChart({ title, timeRange = '7d' }: AnalyticsChartProps) {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const days = timeRange === '24h' ? 24 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const newData = []
    for (let i = days; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      newData.push({
        date: timeRange === '24h' ? `${i}:00` : date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' }),
        accidents: Math.floor(Math.random() * 20) + 5,
        violations: Math.floor(Math.random() * 50) + 20,
        incidents: Math.floor(Math.random() * 30) + 10,
      })
    }
    setData(newData)
  }, [timeRange])

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsArea data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          />
          <Area type="monotone" dataKey="accidents" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
          <Area type="monotone" dataKey="violations" stackId="2" stroke="#f97316" fill="#f97316" fillOpacity={0.6} />
        </RechartsArea>
      </ResponsiveContainer>
    </div>
  )
}

export function IncidentTypePieChart({ title }: AnalyticsChartProps) {
  const data = [
    { name: 'Rear-end Collision', value: 35 },
    { name: 'Head-on', value: 15 },
    { name: 'Side Impact', value: 22 },
    { name: 'Hit Pedestrian', value: 12 },
    { name: 'Roll Over', value: 8 },
    { name: 'Other', value: 8 },
  ]

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <PieChart className="w-5 h-5 text-purple-400" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          />
        </RechartsPie>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
            <span className="text-gray-400">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ResponseTimeChart({ title, timeRange = '7d' }: AnalyticsChartProps) {
  const data = [
    { day: 'Mon', avgTime: 8.5, target: 10 },
    { day: 'Tue', avgTime: 7.2, target: 10 },
    { day: 'Wed', avgTime: 9.1, target: 10 },
    { day: 'Thu', avgTime: 6.8, target: 10 },
    { day: 'Fri', avgTime: 10.2, target: 10 },
    { day: 'Sat', avgTime: 11.5, target: 10 },
    { day: 'Sun', avgTime: 7.8, target: 10 },
  ]

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-green-400" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RechartsLine data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="day" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          />
          <Line type="monotone" dataKey="avgTime" stroke="#22c55e" strokeWidth={2} name="Avg Response (min)" />
          <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} name="Target" />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  )
}

export function RoadUserAnalysisChart({ title }: AnalyticsChartProps) {
  const data = [
    { category: 'Motorists', male: 65, female: 35 },
    { category: 'Pedestrians', male: 55, female: 45 },
    { category: 'Motorcyclists', male: 82, female: 18 },
    { category: 'Cyclists', male: 60, female: 40 },
    { category: 'Passengers', male: 45, female: 55 },
  ]

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-cyan-400" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="category" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          />
          <Legend />
          <Bar dataKey="male" stackId="a" fill="#3b82f6" name="Male %" />
          <Bar dataKey="female" stackId="a" fill="#ec4899" name="Female %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SpeedViolationHeatmap({ title }: AnalyticsChartProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  const generateHeatmapData = () => {
    const data: { day: string; hour: number; value: number }[] = []
    days.forEach((day, dayIndex) => {
      hours.forEach(hour => {
        const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19)
        const isWeekend = dayIndex >= 5
        let value = Math.random() * 30
        if (isRushHour) value += 40
        if (isWeekend && hour >= 10 && hour <= 16) value += 20
        
        data.push({ day, hour, value: Math.round(value) })
      })
    })
    return data
  }

  const data = generateHeatmapData()
  const getColor = (value: number) => {
    if (value > 70) return 'bg-red-500'
    if (value > 50) return 'bg-orange-500'
    if (value > 30) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-orange-400" />
        {title}
      </h3>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 text-xs text-gray-500">
          {days.map(day => (
            <div key={day} className="h-6 flex items-center">{day}</div>
          ))}
        </div>
        <div className="flex-1">
          <div className="flex gap-1 mb-1">
            {hours.filter((_, i) => i % 3 === 0).map(hour => (
              <div key={hour} className="flex-1 text-xs text-gray-500 text-center">{hour}:00</div>
            ))}
          </div>
          <div className="grid grid-cols-24 gap-[2px]">
            {data.map((item, i) => (
              <div 
                key={i}
                className={`h-6 ${getColor(item.value)} opacity-80`}
                title={`${item.day} ${item.hour}:00 - ${item.value} violations`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ComparativeAnalysisChart({ title }: AnalyticsChartProps) {
  const data = [
    { subject: 'Infrastructure', A: 65, B: 75, fullMark: 100 },
    { subject: 'Enforcement', A: 45, B: 60, fullMark: 100 },
    { subject: 'Education', A: 55, B: 50, fullMark: 100 },
    { subject: 'Vehicle Safety', A: 70, B: 65, fullMark: 100 },
    { subject: 'Road Design', A: 60, B: 70, fullMark: 100 },
    { subject: 'Emergency Response', A: 80, B: 85, fullMark: 100 },
  ]

  return (
    <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-indigo-400" />
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
          <Radar name="2024" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          <Radar name="2025" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
          <Legend />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
