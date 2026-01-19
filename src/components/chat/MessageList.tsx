'use client'

import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { User, Copy, Check, Sparkles, Code, FileText, Lightbulb, FileCode, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'
import type { UploadedFile } from './MessageInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  files?: UploadedFile[]
}

interface MessageListProps {
  messages: Message[]
  isLoading?: boolean
  streamingContent?: string
  onSuggestionClick?: (suggestion: string) => void
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace('language-', '') || ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500 dark:text-green-400" />
          ) : (
            <Copy className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          )}
        </Button>
      </div>
      {language && (
        <div className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-4 py-1 rounded-t-lg border-b border-gray-300 dark:border-gray-700">
          {language}
        </div>
      )}
      <pre className={cn('bg-gray-200 dark:bg-gray-800 p-4 overflow-x-auto', language ? 'rounded-b-lg' : 'rounded-lg')}>
        <code className="text-sm text-gray-800 dark:text-gray-100">{children}</code>
      </pre>
    </div>
  )
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('html') || type.includes('css')) return FileCode
  return FileText
}

function FileAttachment({ file }: { file: UploadedFile }) {
  const Icon = getFileIcon(file.type)
  const isImage = file.type.startsWith('image/')

  if (isImage) {
    return (
      <div className="relative max-w-sm">
        <img
          src={file.content}
          alt={file.name}
          className="rounded-lg border border-gray-300 dark:border-gray-700 max-h-64 object-contain"
        />
        <div className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-1 text-xs text-white">
          {file.name}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg px-3 py-2 max-w-fit">
      <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
      <span className="text-sm text-gray-900 dark:text-white">{file.name}</span>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={cn('flex gap-4 py-5 px-4 md:px-0')}>
      <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
        <AvatarFallback
          className={cn(
            'text-white text-xs',
            isUser
              ? 'bg-blue-600'
              : 'bg-emerald-600'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {isUser ? 'You' : 'RAG Chat'}
        </p>

        {/* File attachments */}
        {message.files && message.files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.files.map(file => (
              <FileAttachment key={file.id} file={file} />
            ))}
          </div>
        )}

        {message.content && (
          <div className="text-gray-700 dark:text-gray-200 prose dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-p:leading-7">
            <ReactMarkdown
              components={{
                code({ className, children, ...props }) {
                  const isInline = !className
                  if (isInline) {
                    return (
                      <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    )
                  }
                  return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
                },
                p({ children }) {
                  return <p className="mb-4 last:mb-0 leading-7">{children}</p>
                },
                ul({ children }) {
                  return <ul className="list-disc list-outside ml-4 mb-4 space-y-2">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="list-decimal list-outside ml-4 mb-4 space-y-2">{children}</ol>
                },
                a({ href, children }) {
                  return (
                    <a href={href} className="text-blue-500 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  )
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-4 py-5 px-4 md:px-0">
      <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
        <AvatarFallback className="bg-emerald-600 text-white text-xs">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">RAG Chat</p>
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-4 py-5 px-4 md:px-0">
      <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
        <AvatarFallback className="bg-emerald-600 text-white text-xs">
          <Sparkles className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">RAG Chat</p>
        <div className="text-gray-700 dark:text-gray-200 prose dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
          <span className="inline-block w-2 h-5 bg-blue-500 dark:bg-blue-400 animate-pulse ml-0.5 -mb-1" />
        </div>
      </div>
    </div>
  )
}

interface SuggestionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}

function SuggestionCard({ icon, title, description, onClick }: SuggestionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all text-left group"
    >
      <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 mb-3 transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </button>
  )
}

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick?: (suggestion: string) => void }) {
  const suggestions = [
    {
      icon: <Code className="h-5 w-5" />,
      title: "Help me write code",
      description: "Generate or debug code in any language",
      prompt: "Help me write a Python function that sorts a list of dictionaries by a specific key"
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Summarize text",
      description: "Condense long documents or articles",
      prompt: "Summarize the key points of the following text for me:"
    },
    {
      icon: <Lightbulb className="h-5 w-5" />,
      title: "Brainstorm ideas",
      description: "Get creative suggestions and solutions",
      prompt: "Give me 5 creative ideas for a weekend project"
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Explain a concept",
      description: "Learn something new or complex",
      prompt: "Explain how machine learning works in simple terms"
    },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-3xl mx-auto w-full">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">What can I help with?</h1>
        <p className="text-gray-500 dark:text-gray-400 text-base">
          Choose a suggestion below or type your own message
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={index}
            icon={suggestion.icon}
            title={suggestion.title}
            description={suggestion.description}
            onClick={() => onSuggestionClick?.(suggestion.prompt)}
          />
        ))}
      </div>
    </div>
  )
}

export function MessageList({ messages, isLoading, streamingContent, onSuggestionClick }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  if (messages.length === 0 && !isLoading && !streamingContent) {
    return <WelcomeScreen onSuggestionClick={onSuggestionClick} />
  }

  return (
    <ScrollArea className="flex-1 h-full overflow-auto" ref={scrollRef}>
      <div className="max-w-3xl mx-auto py-4 pb-8">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {streamingContent && <StreamingMessage content={streamingContent} />}
        {isLoading && !streamingContent && <TypingIndicator />}
      </div>
    </ScrollArea>
  )
}
