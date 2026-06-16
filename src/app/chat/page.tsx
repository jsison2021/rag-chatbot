'use client'

import { useAuth } from '@/context/AuthContext'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Loader2 } from 'lucide-react'

export default function ChatPage() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    )
  }

  return <ChatInterface />
}
