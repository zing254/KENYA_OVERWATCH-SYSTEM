import { useState, useEffect, useCallback } from 'react'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  speed?: number
  heading?: number
}

interface UseGPSTrackingOptions {
  enableHighAccuracy?: boolean
  maximumAge?: number
  timeout?: number
  watchPosition?: boolean
  emitInterval?: number
}

interface UseGPSTrackingResult {
  currentLocation: Location | null
  error: string | null
  isTracking: boolean
  startTracking: () => void
  stopTracking: () => void
  watchId: number | null
}

export function useGPSTracking(options: UseGPSTrackingOptions = {}): UseGPSTrackingResult {
  const {
    enableHighAccuracy = true,
    maximumAge = 5000,
    timeout = 10000,
    watchPosition = true,
    emitInterval = 5000
  } = options

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsTracking(true)
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined
        }
        setCurrentLocation(location)
        setError(null)

        // Emit location to server (optional)
        // emitLocation(location)
      },
      (err) => {
        setError(err.message)
        setIsTracking(false)
      },
      {
        enableHighAccuracy,
        maximumAge,
        timeout
      }
    )

    setWatchId(watchId)
  }, [enableHighAccuracy, maximumAge, timeout])

  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }, [watchId])

  // Get initial position
  useEffect(() => {
    if (!watchPosition) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (err) => setError(err.message),
        { enableHighAccuracy, timeout }
      )
    }
  }, [watchPosition, enableHighAccuracy, timeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  return {
    currentLocation,
    error,
    isTracking,
    startTracking,
    stopTracking,
    watchId
  }
}

// Hook for offline data storage
export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingItems, setPendingItems] = useState<number>(0)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const saveOffline = async (key: string, data: any) => {
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        synced: false
      }))
      updatePendingCount()
    } catch (err) {
      console.error('Failed to save offline:', err)
    }
  }

  const getOffline = (key: string) => {
    const item = localStorage.getItem(`offline_${key}`)
    return item ? JSON.parse(item) : null
  }

  const updatePendingCount = () => {
    let count = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('offline_')) {
        const item = localStorage.getItem(key)
        if (item) {
          const parsed = JSON.parse(item)
          if (!parsed.synced) count++
        }
      }
    }
    setPendingItems(count)
  }

  const syncOffline = async (endpoint: string) => {
    const items: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('offline_')) {
        items.push(key)
      }
    }

    for (const itemKey of items) {
      const item = localStorage.getItem(itemKey)
      if (item) {
        const parsed = JSON.parse(item)
        if (!parsed.synced) {
          try {
            await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed.data)
            })
            // Mark as synced
            localStorage.setItem(itemKey, JSON.stringify({ ...parsed, synced: true }))
          } catch (err) {
            console.error('Failed to sync:', err)
          }
        }
      }
    }
    updatePendingCount()
  }

  return {
    isOnline,
    pendingItems,
    saveOffline,
    getOffline,
    syncOffline
  }
}
