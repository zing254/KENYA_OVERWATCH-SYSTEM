// API utilities for Citizen Portal

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Request failed: ${response.status}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

// Offline queue for storing requests when offline
const offlineQueue: Array<{ endpoint: string; options: RequestInit }> = []

export function addToOfflineQueue(endpoint: string, options: RequestInit) {
  offlineQueue.push({ endpoint, options })
  try {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue))
  } catch (e) {
    console.error('Failed to save offline queue:', e)
  }
}

export async function syncOfflineQueue(): Promise<number> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 0
  }

  let synced = 0
  const queue = [...offlineQueue]
  offlineQueue.length = 0

  for (const item of queue) {
    try {
      await apiFetch(item.endpoint, item.options)
      synced++
    } catch (e) {
      offlineQueue.push(item)
    }
  }

  try {
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue))
  } catch (e) {
    // Ignore storage errors
  }

  return synced
}

export function loadOfflineQueue() {
  try {
    const saved = localStorage.getItem('offlineQueue')
    if (saved) {
      const items = JSON.parse(saved)
      offlineQueue.push(...items)
    }
  } catch (e) {
    // Ignore errors
  }
}

export async function submitReport(reportData: any): Promise<ApiResponse> {
  return apiFetch('/api/citizen-reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  })
}

export async function getRewards(): Promise<ApiResponse> {
  return apiFetch('/api/rewards')
}

export async function getTrivia(): Promise<ApiResponse> {
  return apiFetch('/api/trivia')
}

export async function submitTriviaAnswer(questionId: string, answer: string): Promise<ApiResponse> {
  return apiFetch('/api/trivia/answer', {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, answer }),
  })
}

export async function getNews(): Promise<ApiResponse> {
  return apiFetch('/api/news')
}

export async function getTrafficUpdates(): Promise<ApiResponse> {
  return apiFetch('/api/traffic/updates')
}

export async function getParkingSpaces(lat: number, lng: number): Promise<ApiResponse> {
  return apiFetch(`/api/parking/nearby?lat=${lat}&lng=${lng}`)
}

export async function getTripRoute(origin: string, destination: string): Promise<ApiResponse> {
  return apiFetch(`/api/trip/route?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)
}
