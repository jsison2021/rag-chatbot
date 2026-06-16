'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, StopCircle, Paperclip, X, FileText, Image as ImageIcon, FileCode } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  content: string // base64 or text content
}

interface MessageInputProps {
  onSend: (message: string, files?: UploadedFile[]) => void
  onStop?: () => void
  disabled?: boolean
  isLoading?: boolean
  placeholder?: string
}

const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'text/javascript',
  'text/typescript',
  'text/html',
  'text/css',
  'application/x-python',
  'text/x-python',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return ImageIcon
  if (type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('html') || type.includes('css')) return FileCode
  return FileText
}

export function MessageInput({
  onSend,
  onStop,
  disabled = false,
  isLoading = false,
  placeholder = 'Message RAG Chat...',
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`File "${file.name}" is too large. Max size is 10MB.`)
        continue
      }

      const isAllowed = ALLOWED_FILE_TYPES.some(type =>
        file.type === type || file.name.endsWith('.md') || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.py')
      )

      if (!isAllowed && !file.type.startsWith('text/')) {
        alert(`File type "${file.type || 'unknown'}" is not supported.`)
        continue
      }

      try {
        let content: string

        if (file.type.startsWith('image/') || file.type === 'application/pdf') {
          // Convert images and PDFs to base64
          content = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        } else {
          // Read text files as text
          content = await file.text()
        }

        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || 'text/plain',
          size: file.size,
          content,
        }

        setFiles(prev => [...prev, uploadedFile])
      } catch (error) {
        console.error('Error reading file:', error)
        alert(`Failed to read file "${file.name}"`)
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleSend = () => {
    if ((message.trim() || files.length > 0) && !disabled && !isLoading) {
      onSend(message.trim(), files.length > 0 ? files : undefined)
      setMessage('')
      setFiles([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="bg-background px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* File previews */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map(file => {
              const Icon = getFileIcon(file.type)
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2 group"
                >
                  {file.type.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.content}
                      alt={file.name}
                      className="h-8 w-8 rounded object-cover"
                    />
                  ) : (
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="ml-1 p-1 hover:bg-accent rounded-md transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md,.csv,.json,.pdf,.png,.jpg,.jpeg,.gif,.webp,.js,.ts,.tsx,.jsx,.py,.html,.css"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Input area */}
        <div className="relative flex items-end bg-card border border-border rounded-3xl shadow-sm focus-within:border-foreground/20 focus-within:ring-4 focus-within:ring-ring/10 transition-all">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 min-h-[52px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground py-4 pl-4 pr-24 text-[0.95rem]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {/* Attachment button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              className={cn(
                'flex items-center justify-center h-9 w-9 rounded-full transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none',
                (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
              )}
              title="Attach files"
            >
              <Paperclip className="h-[18px] w-[18px]" />
            </button>

            {/* Send/Stop button */}
            {isLoading ? (
              <Button
                size="icon"
                onClick={onStop}
                className="h-9 w-9 rounded-full"
              >
                <StopCircle className="h-[18px] w-[18px]" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={(!message.trim() && files.length === 0) || disabled}
                size="icon"
                className="h-9 w-9 rounded-full disabled:opacity-40"
              >
                <ArrowUp className="h-[18px] w-[18px]" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground/70 text-center mt-2.5">
          RAG Chat can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
