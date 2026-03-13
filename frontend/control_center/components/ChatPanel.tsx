'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, X, Send, Users, Hash, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

interface ChatMessage {
  message_id: string
  sender_id: string
  sender_name: string
  sender_role: string
  message: string
  timestamp: string
  channel: string
  is_emergency: boolean
}

interface ChatUser {
  user_id: string
  name: string
  role: string
  status: string
}

const ChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<ChatUser[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState('general')
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const currentUserId = 'control_center_admin'
  const currentUserName = 'Control Center'

  const channels = [
    { id: 'general', name: 'General', icon: Hash },
    { id: 'emergency', name: 'Emergency', icon: AlertTriangle },
    { id: 'dispatch', name: 'Dispatch', icon: Users },
  ]

  useEffect(() => {
    if (!wsRef.current) {
      connectWebSocket()
    }
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const connectWebSocket = () => {
    const wsUrl = `ws://${API_URL.replace('http://', '').replace('https://', '')}/api/v1/chat/ws/chat/${currentUserId}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('Chat connected')
      setConnected(true)
      ws.send(JSON.stringify({
        name: currentUserName,
        role: 'admin',
        channel: channel
      }))
      ws.send(JSON.stringify({ type: 'join_channel', channel }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'chat_message') {
          setMessages(prev => [...prev, data.message])
          if (!isOpen) {
            setUnreadCount(prev => prev + 1)
          }
        } else if (data.type === 'channel_history') {
          setMessages(data.messages || [])
        } else if (data.type === 'user_list') {
          setUsers(data.users || [])
        } else if (data.type === 'connected') {
          console.log('Connected to chat:', data.message)
        }
      } catch (error) {
        console.error('Failed to parse chat message:', error)
      }
    }

    ws.onclose = () => {
      console.log('Chat disconnected')
      setConnected(false)
      wsRef.current = null
    }

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error)
    }

    wsRef.current = ws
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'chat_message',
      message: newMessage.trim(),
      channel
    }))

    setNewMessage('')
  }

  const changeChannel = (newChannel: string) => {
    setChannel(newChannel)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'join_channel', channel: newChannel }))
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Nairobi' })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-400'
      case 'dispatcher': return 'text-blue-400'
      case 'officer': return 'text-green-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => { setIsOpen(true); setUnreadCount(0) }}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-4 w-96 h-[500px] bg-gray-800 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900 rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Team Chat</h3>
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Channels */}
          <div className="flex gap-1 p-2 border-b border-gray-700 bg-gray-850">
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => changeChannel(ch.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  channel === ch.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:text-white'
                }`}
              >
                <ch.icon className="w-3 h-3" />
                {ch.name}
              </button>
            ))}
          </div>

          {/* Users Online */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700 bg-gray-750 overflow-x-auto">
            <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {users.length === 0 ? (
              <span className="text-xs text-gray-500">Connecting...</span>
            ) : (
              users.map(user => (
                <span key={user.user_id} className={`text-xs ${getRoleColor(user.role)} flex-shrink-0`}>
                  {user.name}{users.indexOf(user) < users.length - 1 ? ',' : ''}
                </span>
              ))
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-800">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.message_id}
                  className={`p-2 rounded-lg ${
                    msg.sender_id === currentUserId
                      ? 'bg-green-900/50 ml-8'
                      : msg.is_emergency
                        ? 'bg-red-900/50 mr-8 border border-red-500'
                        : 'bg-gray-700 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium ${getRoleColor(msg.sender_role)}`}>
                      {msg.sender_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.is_emergency && (
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-200">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-700 bg-gray-900 rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`Message #${channel}...`}
                className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !connected}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatPanel
