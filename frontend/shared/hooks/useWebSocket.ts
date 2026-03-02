import { useEffect, useRef, useState, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
const WS_URL = API_URL.replace('http', 'ws')

// Simple token storage (in production, use secure storage)
let cachedToken: string | null = null

export function setCachedToken(token: string | null) {
  cachedToken = token
}

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnect?: boolean
  reconnectInterval?: number
  maxReconnectAttempts?: number
  token?: string | null
}

export function useWebSocket(
  path: string,
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    token: propToken,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const optionsRef = useRef(options)
  optionsRef.current = options

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    if (reconnectAttempts >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const token = propToken ?? cachedToken
    const wsUrl = token 
      ? `${WS_URL}${path}?token=${encodeURIComponent(token)}`
      : `${WS_URL}${path}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      onConnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessage?.(data)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      onDisconnect?.()
      
      if (reconnect) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval)
      }
    }

    ws.onerror = (error) => {
      onError?.(error)
    }

    wsRef.current = ws
  }, [path, reconnect, reconnectInterval, onConnect, onDisconnect, onError, onMessage])

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const subscribe = useCallback((channels: string[]) => {
    send({ type: 'subscribe', channels })
  }, [send])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current?.close()
    wsRef.current = null
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return {
    isConnected,
    lastMessage,
    send,
    subscribe,
    disconnect,
    reconnect: connect,
  }
}

export function useRoadSafetyWebSocket(onMessage?: (data: any) => void) {
  return useWebSocket('/ws/road_safety', {
    onMessage,
    reconnect: true,
    reconnectInterval: 5000,
  })
}
