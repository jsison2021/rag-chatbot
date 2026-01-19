'use client'

import { useAuth } from '@/context/AuthContext'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Loader2, MessageSquare } from 'lucide-react'

export default function ChatPage() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-6">
          <MessageSquare className="h-12 w-12 text-blue-400" />
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return <ChatInterface />
}
