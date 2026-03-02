const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

class AuthError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message)
    this.name = 'AuthError'
  }
}

// Token storage
let accessToken: string | null = null
let refreshToken: string | null = null
let tokenExpiresAt: number = 0
let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

// Event listeners for auth state
const authListeners: Set<(authenticated: boolean) => void> = new Set()

export function onAuthStateChange(listener: (authenticated: boolean) => void) {
  authListeners.add(listener)
  return () => authListeners.delete(listener)
}

function notifyAuthListeners(authenticated: boolean) {
  authListeners.forEach(listener => listener(authenticated))
}

export function setTokens(access: string, refresh: string, expiresIn: number = 86400) {
  accessToken = access
  refreshToken = refresh
  tokenExpiresAt = Date.now() + (expiresIn * 1000)
  notifyAuthListeners(true)
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  tokenExpiresAt = 0
  notifyAuthListeners(false)
}

export function isAuthenticated(): boolean {
  return !!accessToken && Date.now() < tokenExpiresAt
}

export function getAccessToken(): string | null {
  return accessToken
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) {
    clearTokens()
    return false
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const data = await response.json()
    if (data.access_token) {
      accessToken = data.access_token
      tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000
      if (data.refresh_token) {
        refreshToken = data.refresh_token
      }
      return true
    }

    clearTokens()
    return false
  } catch {
    clearTokens()
    return false
  }
}

async function getValidToken(): Promise<string> {
  // If no token, throw auth error
  if (!accessToken) {
    throw new AuthError()
  }

  // If token is about to expire (within 5 minutes), try to refresh
  if (tokenExpiresAt - Date.now() < 5 * 60 * 1000) {
    if (isRefreshing && refreshPromise) {
      const success = await refreshPromise
      if (!success) throw new AuthError()
    } else {
      isRefreshing = true
      refreshPromise = refreshAccessToken()
      const success = await refreshPromise
      isRefreshing = false
      refreshPromise = null
      if (!success) throw new AuthError()
    }
  }

  return accessToken!
}

export async function logout() {
  if (accessToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    } catch {
      // Ignore errors on logout
    }
  }
  clearTokens()
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  // Add auth header if we have a token
  if (accessToken && !options.headers?.['Authorization']) {
    try {
      const token = await getValidToken()
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      }
    } catch (error) {
      if (error instanceof AuthError) {
        clearTokens()
        // For non-auth endpoints, continue without token
        if (!endpoint.startsWith('/api/auth/')) {
          console.warn('Token expired, continuing without authentication')
        }
      }
    }
  }

  try {
    const response = await fetch(url, config)
    
    if (response.status === 401) {
      // Try to refresh token for protected endpoints
      if (!endpoint.startsWith('/api/auth/') && refreshToken) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          // Retry the request with new token
          config.headers = {
            ...config.headers,
            'Authorization': `Bearer ${accessToken}`,
          }
          const retryResponse = await fetch(url, config)
          if (retryResponse.ok) {
            return retryResponse.json()
          }
        }
      }
      
      clearTokens()
      throw new AuthError('Session expired. Please login again.')
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new ApiError(response.status, error.detail || 'Request failed')
    }
    
    return response.json()
  } catch (error) {
    if (error instanceof ApiError || error instanceof AuthError) throw error
    throw new ApiError(0, 'Network error')
  }
}

export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint),
  post: <T>(endpoint: string, data?: unknown) => 
    fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: <T>(endpoint: string, data?: unknown) => 
    fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: <T>(endpoint: string) => 
    fetchApi<T>(endpoint, { method: 'DELETE' }),
}

export default api
