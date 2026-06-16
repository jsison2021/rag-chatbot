'use client'

import { OLLAMA_MODELS } from '@/lib/types'
import { ChevronDown, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const selectedModel = OLLAMA_MODELS.find(m => m.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (modelId: string) => {
    onChange(modelId)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors',
          'hover:bg-accent text-foreground focus:outline-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span className="font-medium text-sm">{selectedModel?.name || 'Select model'}</span>
        <ChevronDown className={cn(
          'h-4 w-4 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 bg-popover text-popover-foreground border border-border rounded-xl shadow-lg min-w-[240px] p-1 animate-in fade-in-0 zoom-in-95">
          {OLLAMA_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model.id)}
              className={cn(
                'w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2',
                'hover:bg-accent focus:bg-accent focus:outline-none cursor-pointer'
              )}
            >
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="font-medium text-sm">{model.name}</span>
                <span className="text-xs text-muted-foreground">{model.description}</span>
              </div>
              {model.id === value && <Check className="h-4 w-4 text-brand shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
