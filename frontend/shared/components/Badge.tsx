import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  pulse?: boolean
}

const variantStyles = {
  default: 'bg-gray-600/50 text-gray-200 border-gray-500',
  success: 'bg-green-900/50 text-green-300 border-green-500/50',
  warning: 'bg-amber-900/50 text-amber-300 border-amber-500/50',
  danger: 'bg-red-900/50 text-red-300 border-red-500/50',
  info: 'bg-blue-900/50 text-blue-300 border-blue-500/50',
}

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
}

export default function Badge({ children, variant = 'default', size = 'md', pulse }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} font-medium ${pulse ? 'animate-pulse' : ''}`}>
      {variant === 'danger' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
      {variant === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
      {variant === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-green-500" />}
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
}

const statusMap: Record<string, { variant: BadgeProps['variant']; label: string }> = {
  active: { variant: 'success', label: 'Active' },
  pending: { variant: 'warning', label: 'Pending' },
  resolved: { variant: 'info', label: 'Resolved' },
  critical: { variant: 'danger', label: 'Critical', pulse: true },
  dispatched: { variant: 'warning', label: 'Dispatched' },
  on_scene: { variant: 'danger', label: 'On Scene', pulse: true },
  cleared: { variant: 'success', label: 'Cleared' },
  detected: { variant: 'info', label: 'Detected' },
  issued: { variant: 'warning', label: 'Issued' },
  paid: { variant: 'success', label: 'Paid' },
  overdue: { variant: 'danger', label: 'Overdue' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusMap[status] || { variant: 'default', label: status }
  return (
    <Badge variant={config.variant} pulse={config.pulse}>
      {config.label}
    </Badge>
  )
}

interface SeverityBadgeProps {
  severity: 'critical' | 'high' | 'medium' | 'low'
}

const severityMap = {
  critical: { variant: 'danger' as const, label: 'Critical', color: 'text-red-400' },
  high: { variant: 'danger' as const, label: 'High', color: 'text-orange-400' },
  medium: { variant: 'warning' as const, label: 'Medium', color: 'text-amber-400' },
  low: { variant: 'success' as const, label: 'Low', color: 'text-green-400' },
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const config = severityMap[severity]
  return (
    <Badge variant={config.variant} pulse={severity === 'critical'}>
      {config.label}
    </Badge>
  )
}
