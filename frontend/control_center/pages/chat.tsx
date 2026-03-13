'use client'

import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout'
import { MessageSquare, X, Send, Users, Hash, AlertTriangle, User } from 'lucide-react'

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

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [users, setUsers] = useState<ChatUser[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState('general')
  const [connected, setConnected] = useState(false)
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
    connectWebSocket()
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
      setTimeout(connectWebSocket, 5000)
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
    <Layout title="Team Chat - KENYA OVERWATCH">
      <div className="flex h-[calc(100vh-100px)]">
        {/* Sidebar - Channels & Users */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Connection Status */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-white font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* Channels */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-3">Channels</h3>
            <div className="space-y-1">
              {channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => changeChannel(ch.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                    channel === ch.id
                      ? 'bg-ntsa-primary text-white'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <ch.icon className="w-4 h-4" />
                  {ch.name}
                </button>
              ))}
            </div>
          </div>

          {/* Online Users */}
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-gray-400 text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Online ({users.length})
            </h3>
            <div className="space-y-2">
              {users.map(user => (
                <div key={user.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-700/50">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <User className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{user.name}</p>
                    <p className={`text-xs ${getRoleColor(user.role)}`}>{user.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-green-400" />
              <div>
                <h2 className="text-white font-semibold">#{channel}</h2>
                <p className="text-gray-400 text-sm">Team communication</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">{users.length} online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Start the conversation with responders!</p>
              </div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.message_id}
                  className={`flex gap-3 ${
                    msg.sender_id === currentUserId ? 'flex-row-reverse' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.sender_id === currentUserId ? 'bg-green-600' : 'bg-blue-600'
                  }`}>
                    <span className="text-white font-bold text-sm">
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`max-w-md ${
                    msg.sender_id === currentUserId ? 'text-right' : ''
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium ${getRoleColor(msg.sender_role)}`}>
                        {msg.sender_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.timestamp)}
                      </span>
                      {msg.is_emergency && (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      msg.sender_id === currentUserId
                        ? 'bg-green-900/50'
                        : msg.is_emergency
                          ? 'bg-red-900/50 border border-red-500'
                          : 'bg-gray-800'
                    }`}>
                      <p className="text-white">{msg.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={`Message #${channel}...`}
                disabled={!connected}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !connected}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
