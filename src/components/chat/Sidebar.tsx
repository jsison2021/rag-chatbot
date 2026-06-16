'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/context/AuthContext'
import {
  Plus,
  LogOut,
  Trash2,
  PanelLeftClose,
  PanelLeft,
  MessageSquareText,
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

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-300',
        collapsed ? 'w-[60px]' : 'w-[280px]'
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center h-14 px-3', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight px-1">RAG Chat</span>
        )}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* New Chat */}
      <div className="px-3 pb-2">
        <Button
          onClick={onNewConversation}
          variant="outline"
          className={cn(
            'border-sidebar-border bg-transparent hover:bg-sidebar-accent text-sidebar-foreground font-normal',
            collapsed ? 'w-9 h-9 p-0 mx-auto' : 'w-full justify-start gap-2'
          )}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>New chat</span>}
        </Button>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1 px-2">
        {!collapsed && (
          <p className="px-3 pt-3 pb-1.5 text-xs font-medium text-muted-foreground/70">
            Recent
          </p>
        )}
        <div className="space-y-0.5 pb-2">
          {conversations.map((conversation) => {
            const active = conversation.id === currentConversationId
            return (
              <div
                key={conversation.id}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition-colors',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                )}
                onClick={() => onSelectConversation(conversation.id)}
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId(null)}
                title={collapsed ? conversation.title : undefined}
              >
                <MessageSquareText className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 min-w-0 truncate text-sm">{conversation.title}</span>
                    {(hoveredId === conversation.id || active) && (
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 -mr-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conversation.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )
          })}
          {conversations.length === 0 && !collapsed && (
            <p className="text-sm text-muted-foreground/70 px-3 py-6 text-center">
              No conversations yet
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        {isGuest ? (
          !collapsed && (
            <div className="px-3 py-2.5 rounded-lg bg-sidebar-accent/50">
              <p className="text-xs font-medium text-foreground">Guest session</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in to save your chats
              </p>
            </div>
          )
        ) : (
          <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
            {user && (
              <div className="h-8 w-8 shrink-0 rounded-full bg-brand text-brand-foreground flex items-center justify-center text-xs font-semibold">
                {user.email?.[0]?.toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <>
                <span className="flex-1 min-w-0 truncate text-sm text-muted-foreground">
                  {user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
