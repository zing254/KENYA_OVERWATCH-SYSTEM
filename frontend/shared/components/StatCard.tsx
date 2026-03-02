import React from 'react'
import { Shield } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

const variantStyles = {
  default: 'from-gray-800 to-gray-900 border-green-500/30',
  success: 'from-green-900/50 to-green-800/30 border-green-500/30',
  warning: 'from-amber-900/50 to-amber-800/30 border-amber-500/30',
  danger: 'from-red-900/50 to-red-800/30 border-red-500/30',
}

const iconVariants = {
  default: 'bg-green-500/20 text-green-400',
  success: 'bg-green-500/20 text-green-400',
  warning: 'bg-amber-500/20 text-amber-400',
  danger: 'bg-red-500/20 text-red-400',
}

export default function StatCard({ title, value, subtitle, icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={`bg-gradient-to-br ${variantStyles[variant]} border rounded-xl p-5 shadow-lg`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              <span className="text-xs font-medium">
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-gray-500 text-xs">vs last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconVariants[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function NTSALogo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }
  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }
  
  return (
    <div className="flex items-center gap-2">
      <Shield className={`${sizes[size]} text-ntsa-primaryLight`} />
      <div>
        <span className={`${textSizes[size]} font-bold text-white block leading-tight`}>NTSA</span>
        <span className={`${textSizes[size]} text-gray-400`}>Road Safety</span>
      </div>
    </div>
  )
}
