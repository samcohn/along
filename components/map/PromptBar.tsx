'use client'

import { useState, useRef } from 'react'
import { useMapStore } from '@/store/map'
import dynamic from 'next/dynamic'

const TriagePanel = dynamic(() => import('@/components/panels/TriagePanel'), { ssr: false })

interface TriageResult {
  id: string
  name: string
  formatted_address: string
  description: string
  category: string[]
  coordinates: { lat: number; lng: number }
  source: { type: string; source_name: string; source_url?: string; confidence: number }
}

export default function PromptBar() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [triageResults, setTriageResults] = useState<TriageResult[] | null>(null)
  const [triageQuery, setTriageQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { setActivePanel } = useMapStore()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q) return

    setLoading(true)
    inputRef.current?.blur()

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()

      if (data.results?.length > 0) {
        setTriageQuery(q)
        setTriageResults(data.results)
      } else {
        // No results — fall through to building panel
        setActivePanel('building')
      }
    } catch {
      setActivePanel('building')
    } finally {
      setLoading(false)
      setValue('')
    }
  }

  return (
    <>
      {/* Floating prompt bar */}
      <div
        className={`
          absolute top-6 left-1/2 -translate-x-1/2 z-10
          transition-all duration-300 ease-out
          ${focused ? 'w-[520px]' : 'w-[380px]'}
          ${triageResults ? 'opacity-50 pointer-events-none' : 'opacity-100'}
        `}
      >
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            {/* Icon: spinner when loading, search otherwise */}
            <div className="absolute left-4 pointer-events-none text-white/40">
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={loading ? 'Researching…' : 'What do you want to map?'}
              disabled={loading}
              className={`
                w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/40
                bg-black/70 backdrop-blur-xl border transition-all duration-300
                focus:outline-none focus:ring-0 disabled:opacity-60
                ${focused ? 'border-white/30 bg-black/80' : 'border-white/15 hover:border-white/25'}
              `}
            />

            {value && !loading && (
              <button
                type="submit"
                className="absolute right-3 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-white/90 transition"
              >
                Go
              </button>
            )}
          </div>
        </form>

        {/* Mode hint */}
        {focused && !loading && (
          <p className="text-white/25 text-xs text-center mt-2">
            Describe what to map — or{' '}
            <button
              type="button"
              className="text-white/40 hover:text-white/60 underline transition"
              onMouseDown={(e) => { e.preventDefault(); setActivePanel('building') }}
            >
              build manually
            </button>
          </p>
        )}
      </div>

      {/* Triage panel — slides in when research results are ready */}
      {triageResults && (
        <TriagePanel
          results={triageResults}
          query={triageQuery}
          onClose={() => setTriageResults(null)}
        />
      )}
    </>
  )
}
