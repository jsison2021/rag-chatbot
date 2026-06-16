'use client'

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Copy, Check, Code, FileText, Lightbulb, GraduationCap, FileCode, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="relative group my-4 rounded-xl border border-border overflow-hidden bg-muted/60">
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{language || 'code'}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm font-mono text-foreground">{children}</code>
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

  if (file.type.startsWith('image/')) {
    return (
      <div className="relative max-w-xs">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={file.content}
          alt={file.name}
          className="rounded-xl border border-border max-h-64 object-contain"
        />
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{file.name}</span>
    </div>
  )
}

const markdownComponents = {
  code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { className?: string }) {
    const isInline = !className
    if (isInline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-[0.85em] font-mono" {...props}>
          {children}
        </code>
      )
    }
    return <CodeBlock className={className}>{String(children).replace(/\n$/, '')}</CodeBlock>
  },
  p({ children }: { children?: React.ReactNode }) {
    return <p className="mb-4 last:mb-0 leading-7">{children}</p>
  },
  ul({ children }: { children?: React.ReactNode }) {
    return <ul className="list-disc list-outside ml-5 mb-4 space-y-1.5">{children}</ul>
  },
  ol({ children }: { children?: React.ReactNode }) {
    return <ol className="list-decimal list-outside ml-5 mb-4 space-y-1.5">{children}</ol>
  },
  a({ href, children }: { href?: string; children?: React.ReactNode }) {
    return (
      <a href={href} className="text-brand underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  },
}

function UserMessage({ message }: { message: Message }) {
  return (
    <div className="flex flex-col items-end gap-2 py-3">
      {message.files && message.files.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-end">
          {message.files.map((file) => (
            <FileAttachment key={file.id} file={file} />
          ))}
        </div>
      )}
      {message.content && (
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[0.95rem] leading-7 whitespace-pre-wrap">
          {message.content}
        </div>
      )}
    </div>
  )
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="py-3">
      <div className="prose dark:prose-invert max-w-none text-[0.95rem] text-foreground prose-pre:p-0 prose-pre:bg-transparent prose-headings:font-semibold">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

function StreamingMessage({ content }: { content: string }) {
  return (
    <div className="py-3">
      <div className="prose dark:prose-invert max-w-none text-[0.95rem] text-foreground prose-pre:p-0 prose-pre:bg-transparent">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        <span className="inline-block w-1.5 h-4 bg-brand rounded-sm animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="py-4 flex gap-1.5">
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function SuggestionCard({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-foreground/15 transition-colors text-left"
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
    </button>
  )
}

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick?: (suggestion: string) => void }) {
  const suggestions = [
    { icon: <Code className="h-[18px] w-[18px]" />, title: 'Help me write code', prompt: 'Help me write a Python function that sorts a list of dictionaries by a specific key' },
    { icon: <FileText className="h-[18px] w-[18px]" />, title: 'Summarize a document', prompt: 'Summarize the key points of the following text for me:' },
    { icon: <Lightbulb className="h-[18px] w-[18px]" />, title: 'Brainstorm ideas', prompt: 'Give me 5 creative ideas for a weekend project' },
    { icon: <GraduationCap className="h-[18px] w-[18px]" />, title: 'Explain a concept', prompt: 'Explain how machine learning works in simple terms' },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-8">
          What can I help with?
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {suggestions.map((s, i) => (
            <SuggestionCard key={i} icon={s.icon} title={s.title} onClick={() => onSuggestionClick?.(s.prompt)} />
          ))}
        </div>
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
      <div className="max-w-3xl mx-auto px-4 py-6">
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage key={message.id} content={message.content} />
          )
        )}
        {streamingContent && <StreamingMessage content={streamingContent} />}
        {isLoading && !streamingContent && <TypingIndicator />}
      </div>
    </ScrollArea>
  )
}
