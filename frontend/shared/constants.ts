export const NTSA_COLORS = {
  primary: '#14532D',
  primaryLight: '#22C55E',
  primaryDark: '#0F2F1F',
  accent: '#BB0000',
  accentLight: '#DC2626',
  black: '#000000',
  white: '#FFFFFF',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
}

export const STATUS_COLORS = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#22C55E',
}

export const SEVERITY_LEVELS = {
  critical: { label: 'Critical', color: '#EF4444', bg: '#FEF2F2' },
  high: { label: 'High', color: '#F97316', bg: '#FFF7ED' },
  medium: { label: 'Medium', color: '#F59E0B', bg: '#FFFBEB' },
  low: { label: 'Low', color: '#22C55E', bg: '#F0FDF4' },
}

export const VIOLATION_TYPES = [
  { id: 'speeding', label: 'Speeding', icon: '⏱️', color: '#EF4444' },
  { id: 'red_light', label: 'Red Light Jumping', icon: '🚦', color: '#F97316' },
  { id: 'drunk_driving', label: 'Drunk Driving', icon: '🍺', color: '#8B5CF6' },
  { id: 'reckless', label: 'Reckless Driving', icon: '⚠️', color: '#F59E0B' },
  { id: 'illegal_parking', label: 'Illegal Parking', icon: '🅿️', color: '#6B7280' },
  { id: 'using_phone', label: 'Using Phone', icon: '📱', color: '#3B82F6' },
  { id: 'overloading', label: 'Overloading', icon: '⚖️', color: '#EC4899' },
  { id: 'wrong_way', label: 'Wrong Way', icon: '↩️', color: '#EF4444' },
  { id: 'no_seatbelt', label: 'No Seatbelt', icon: '🎗️', color: '#14B8A6' },
  { id: 'expired_license', label: 'Expired License', icon: '📄', color: '#6366F1' },
]

export const ACCIDENT_TYPES = [
  { id: 'head_on', label: 'Head-on Collision', icon: '💥' },
  { id: 'rear_end', label: 'Rear-end Collision', icon: '🔙' },
  { id: 'side_impact', label: 'Side Impact', icon: '👈' },
  { id: 'rollover', label: 'Rollover', icon: '🔄' },
  { id: 'hit_pedestrian', label: 'Hit Pedestrian', icon: '🚶' },
  { id: 'hit_animal', label: 'Hit Animal', icon: '🐄' },
  { id: 'single_vehicle', label: 'Single Vehicle', icon: '🚗' },
  { id: 'multi_vehicle', label: 'Multi Vehicle', icon: '🚙' },
]

export const KENYA_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi',
  'Kitale', 'Garissa', 'Nyeri', 'Meru', 'Migori', 'Makueni', 'Kakamega',
  'Kiambu', 'Kilifi', 'Bungoma', 'Baringo', 'Laikipia', 'Kisii',
]

export const ROAD_CATEGORIES = [
  { id: 'highway', label: 'Highway', speedLimit: 100 },
  { id: 'urban', label: 'Urban Road', speedLimit: 50 },
  { id: 'residential', label: 'Residential', speedLimit: 30 },
  { id: 'school', label: 'School Zone', speedLimit: 20 },
]
