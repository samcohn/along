'use client'

import { useState, useRef } from 'react'
import { useMapStore } from '@/store/map'

export default function PromptBar() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setActivePanel } = useMapStore()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    // Phase 3: hand off to research agent
    // For now just open the building panel
    setActivePanel('building')
    setValue('')
    inputRef.current?.blur()
  }

  return (
    <div
      className={`
        absolute top-6 left-1/2 -translate-x-1/2 z-10
        transition-all duration-300 ease-out
        ${focused ? 'w-[480px]' : 'w-[360px]'}
      `}
    >
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          {/* Search icon */}
          <div className="absolute left-4 pointer-events-none text-white/40">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="What do you want to map?"
            className={`
              w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/40
              bg-black/70 backdrop-blur-xl border transition-all duration-300
              focus:outline-none focus:ring-0
              ${focused
                ? 'border-white/30 bg-black/80'
                : 'border-white/15 hover:border-white/25'
              }
            `}
          />

          {value && (
            <button
              type="submit"
              className="absolute right-3 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition"
            >
              Go
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
