'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ModelSelector } from './ModelSelector'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/context/AuthContext'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, LogIn, UserPlus } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

import type { UploadedFile } from './MessageInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  files?: UploadedFile[]
}

interface Conversation {
  id: string
  title: string
  model: string
  updated_at: string
}

interface GuestConversation {
  id: string
  title: string
  model: string
  messages: Message[]
  updated_at: string
}

const GUEST_STORAGE_KEY = 'rag-chat-guest-conversations'

// Helper functions for guest storage
function loadGuestConversations(): GuestConversation[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = sessionStorage.getItem(GUEST_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveGuestConversations(conversations: GuestConversation[]) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(conversations))
  } catch {
    // Storage full or unavailable
  }
}

export function ChatInterface() {
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [guestConversations, setGuestConversations] = useState<GuestConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('gpt-oss:20b')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load conversations on mount (only for logged in users)
  const loadConversations = useCallback(async () => {
    if (!user) return

    const { data } = await supabase
      .from('conversations')
      .select('id, title, model, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (data) {
      setConversations(data)
    }
  }, [user, supabase])

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('id, role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data as Message[])
    }
  }, [supabase])

  // Create new conversation (only for logged in users)
  const createConversation = useCallback(async (title: string) => {
    if (!user) return null

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title,
        model: selectedModel,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return null
    }

    await loadConversations()
    return data.id
  }, [user, selectedModel, supabase, loadConversations])

  // Save message (only for logged in users)
  const saveMessage = useCallback(async (conversationId: string, role: string, content: string) => {
    if (!user || !conversationId) return

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })

    if (error) {
      console.error('Error saving message:', error)
    }

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)
  }, [user, supabase])

  // Handle send message - works for both logged in and guest users
  const handleSendMessage = useCallback(async (content: string, files?: UploadedFile[]) => {
    if (isLoading) return

    let convId = currentConversationId

    // Create conversation if needed
    if (!convId) {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '')

      if (user) {
        // Logged in user - create in database
        convId = await createConversation(title)
        if (convId) {
          setCurrentConversationId(convId)
        }
      } else {
        // Guest user - create temporary conversation
        convId = crypto.randomUUID()
        const newGuestConv: GuestConversation = {
          id: convId,
          title,
          model: selectedModel,
          messages: [],
          updated_at: new Date().toISOString(),
        }
        const updated = [newGuestConv, ...guestConversations]
        setGuestConversations(updated)
        saveGuestConversations(updated)
        setCurrentConversationId(convId)
      }
    }

    // Build content with file context - parse PDFs server-side
    let messageContent = content
    if (files && files.length > 0) {
      const fileContexts: string[] = []

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          fileContexts.push(`[Image: ${file.name}]`)
        } else if (file.type === 'application/pdf') {
          // Parse PDF on server
          try {
            console.log('Sending PDF to parse:', file.name, 'content length:', file.content.length)
            const response = await fetch('/api/parse-document', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                content: file.content,
                type: file.type,
                name: file.name,
              }),
            })

            if (response.ok) {
              const result = await response.json()
              console.log('PDF parsed successfully:', result.name, 'text length:', result.charCount)
              const text = result.text
              const maxContentLength = 15000
              const truncatedContent = text.length > maxContentLength
                ? text.slice(0, maxContentLength) + '\n... (content truncated)'
                : text
              fileContexts.push(`[Document: ${file.name}]\n\n---\n${truncatedContent}\n---`)
            } else {
              const errorResult = await response.json().catch(() => ({ error: 'Unknown error' }))
              console.error('PDF parse failed:', response.status, errorResult)
              fileContexts.push(`[Document: ${file.name}] (Failed to parse PDF: ${errorResult.error || response.statusText})`)
            }
          } catch (err) {
            console.error('PDF parse error:', err)
            fileContexts.push(`[Document: ${file.name}] (Failed to parse PDF)`)
          }
        } else {
          // Text files
          const maxContentLength = 15000
          const truncatedContent = file.content.length > maxContentLength
            ? file.content.slice(0, maxContentLength) + '\n... (content truncated)'
            : file.content
          fileContexts.push(`[File: ${file.name}]\n\`\`\`\n${truncatedContent}\n\`\`\``)
        }
      }

      messageContent = fileContexts.join('\n\n') + (content ? '\n\n' + content : '')
    }

    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      files,
    }
    setMessages((prev) => [...prev, userMessage])

    // Save message
    if (user && convId) {
      await saveMessage(convId, 'user', content)
    } else if (convId) {
      // Save to guest storage
      const updated = guestConversations.map(conv =>
        conv.id === convId
          ? { ...conv, messages: [...conv.messages, userMessage], updated_at: new Date().toISOString() }
          : conv
      )
      setGuestConversations(updated)
      saveGuestConversations(updated)
    }

    // Start streaming response
    setIsLoading(true)
    setStreamingContent('')

    abortControllerRef.current = new AbortController()

    try {
      // Build messages for API, including file content in the latest user message
      const apiMessages = [...messages, { ...userMessage, content: messageContent }].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new Error(errBody?.error || `Request failed (${response.status})`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            if (json.content) {
              fullContent += json.content
              setStreamingContent(fullContent)
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
      }
      setMessages((prev) => [...prev, assistantMessage])
      setStreamingContent('')

      // Save message
      if (user && convId) {
        await saveMessage(convId, 'assistant', fullContent)
      } else if (convId) {
        // Save to guest storage
        const updated = guestConversations.map(conv =>
          conv.id === convId
            ? { ...conv, messages: [...conv.messages, assistantMessage], updated_at: new Date().toISOString() }
            : conv
        )
        setGuestConversations(updated)
        saveGuestConversations(updated)
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User stopped generation
        if (streamingContent) {
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: streamingContent,
          }
          setMessages((prev) => [...prev, assistantMessage])
          if (user && convId) {
            await saveMessage(convId, 'assistant', streamingContent)
          }
        }
      } else {
        console.error('Error:', error)
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Sorry, an error occurred: ${(error as Error).message}`,
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    } finally {
      setIsLoading(false)
      setStreamingContent('')
      abortControllerRef.current = null
      if (user) {
        await loadConversations()
      }
    }
  }, [user, isLoading, currentConversationId, selectedModel, messages, createConversation, saveMessage, loadConversations, streamingContent])

  // Handle stop
  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setCurrentConversationId(null)
    setMessages([])
    setMobileMenuOpen(false)
  }, [])

  // Handle select conversation
  const handleSelectConversation = useCallback(async (id: string) => {
    setCurrentConversationId(id)

    if (user) {
      // Load from database for logged in users
      await loadMessages(id)
      const conv = conversations.find((c) => c.id === id)
      if (conv) {
        setSelectedModel(conv.model)
      }
    } else {
      // Load from guest storage
      const guestConv = guestConversations.find((c) => c.id === id)
      if (guestConv) {
        setMessages(guestConv.messages)
        setSelectedModel(guestConv.model)
      }
    }
    setMobileMenuOpen(false)
  }, [user, loadMessages, conversations, guestConversations])

  // Handle delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    if (user) {
      await supabase.from('conversations').delete().eq('id', id)
      await loadConversations()
    } else {
      // Delete from guest storage
      const updated = guestConversations.filter(conv => conv.id !== id)
      setGuestConversations(updated)
      saveGuestConversations(updated)
    }

    if (currentConversationId === id) {
      handleNewConversation()
    }
  }, [user, supabase, currentConversationId, handleNewConversation, loadConversations, guestConversations])

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    } else {
      // Load guest conversations from session storage
      setGuestConversations(loadGuestConversations())
    }
  }, [user, loadConversations])

  // Get the conversations to display (from DB for logged in, from session for guests)
  const displayConversations = user
    ? conversations
    : guestConversations.map(gc => ({
        id: gc.id,
        title: gc.title,
        model: gc.model,
        updated_at: gc.updated_at,
      }))

  const showSidebar = user || guestConversations.length > 0

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Desktop Sidebar */}
      {showSidebar && (
        <div className="hidden md:block">
          <Sidebar
            conversations={displayConversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isGuest={!user}
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      {showSidebar && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-sidebar border-sidebar-border">
            <Sidebar
              conversations={displayConversations}
              currentConversationId={currentConversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              isGuest={!user}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Header */}
        <header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="flex items-center gap-1">
            {showSidebar && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <ModelSelector
              value={selectedModel}
              onChange={setSelectedModel}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {!user && (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <LogIn className="h-4 w-4 mr-1.5" />
                    Sign in
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="rounded-full">
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </header>

        {/* Messages */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          streamingContent={streamingContent}
          onSuggestionClick={handleSendMessage}
        />

        {/* Input */}
        <MessageInput
          onSend={handleSendMessage}
          onStop={handleStop}
          isLoading={isLoading}
          placeholder={user ? "Send a message..." : "Send a message (sign in to save conversations)"}
        />
      </div>
    </div>
  )
}
