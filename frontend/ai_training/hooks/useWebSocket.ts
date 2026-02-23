import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { WebSocketMessage } from '@/types'

const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'

export const useWebSocket = (userId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: userId ? { user_id: userId } : {},
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })

    newSocket.on('message', (message: WebSocketMessage) => {
      setMessages(prev => [message, ...prev.slice(0, 99)]) // Keep last 100 messages
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [userId])

  const sendMessage = (type: string, data: any) => {
    if (socket?.connected) {
      socket.emit('message', { type, data })
    }
  }

  const subscribeToAlerts = () => {
    sendMessage('subscribe_alerts', {})
  }

  const sendPing = () => {
    sendMessage('ping', {})
  }

  return {
    socket,
    connected,
    messages,
    sendMessage,
    subscribeToAlerts,
    sendPing,
  }
}

export default useWebSocket