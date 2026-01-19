'use client'

import { OLLAMA_MODELS } from '@/lib/types'
import { ChevronDown, Sparkles } from 'lucide-react'
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
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white",
          "focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Sparkles className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
        <span className="font-medium text-sm">{selectedModel?.name || 'Select model'}</span>
        <ChevronDown className={cn(
          "h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl min-w-[220px] py-1 animate-in fade-in-0 zoom-in-95">
          {OLLAMA_MODELS.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => handleSelect(model.id)}
              className={cn(
                "w-full text-left px-3 py-2.5 mx-1 rounded-lg transition-colors",
                "hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 focus:outline-none",
                "text-gray-900 dark:text-white cursor-pointer",
                model.id === value && "bg-gray-100 dark:bg-gray-700"
              )}
              style={{ width: 'calc(100% - 8px)' }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{model.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{model.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
