'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/context/AuthContext'
import {
  Plus,
  MessageSquare,
  LogOut,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Conversation {
  id: string
  title: string
  model: string
  updated_at: string
}

interface SidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  isGuest?: boolean
}

export function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  collapsed = false,
  onToggleCollapse,
  isGuest = false,
}: SidebarProps) {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
            RAG Chat
          </h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="px-3 pb-3">
        <Button
          onClick={onNewConversation}
          className={cn(
            'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white',
            collapsed ? 'w-10 p-0' : 'w-full'
          )}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span className="ml-2">New Chat</span>}
        </Button>
      </div>

      <Separator className="bg-gray-200 dark:bg-gray-800" />

      {/* Conversations List */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
                conversation.id === currentConversationId
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
              )}
              onClick={() => onSelectConversation(conversation.id)}
              onMouseEnter={() => setHoveredId(conversation.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{conversation.title}</p>
                    <p className="text-xs text-gray-500">{formatDate(conversation.updated_at)}</p>
                  </div>
                  {hoveredId === conversation.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 hover:bg-transparent"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteConversation(conversation.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
          {conversations.length === 0 && !collapsed && (
            <p className="text-sm text-gray-500 text-center py-4">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator className="bg-gray-200 dark:bg-gray-800" />

      {/* User Section */}
      <div className="p-3 space-y-2">
        {isGuest ? (
          // Guest user - show temp session notice
          !collapsed && (
            <div className="px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Temporary session
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Sign in to save permanently
              </p>
            </div>
          )
        ) : (
          // Logged in user
          <>
            {!collapsed && user && (
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</span>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className={cn(
                'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800',
                collapsed ? 'w-10 p-0 mx-auto' : 'w-full justify-start'
              )}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span className="ml-2">Sign out</span>}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
