'use client'

import { useState, useRef } from 'react'
import { useMapStore } from '@/store/map'
import dynamic from 'next/dynamic'
import type { Plan } from '@/components/panels/PlanReviewPanel'

const PlanReviewPanel = dynamic(() => import('@/components/panels/PlanReviewPanel'), { ssr: false })

export default function PromptBar() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('Researching…')
  const [plan, setPlan] = useState<Plan | null>(null)
  const [refining, setRefining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { setActivePanel } = useMapStore()

  async function runResearch(query: string) {
    setError(null)
    setLoading(true)
    setLoadingMsg('Thinking…')
    inputRef.current?.blur()

    // Cycle through status messages while waiting
    const messages = ['Thinking…', 'Researching places…', 'Building your plan…']
    let i = 0
    const ticker = setInterval(() => { i++; setLoadingMsg(messages[i % messages.length]) }, 2500)

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      const data = await res.json()

      if (!res.ok) {
        // Show the real error so we can debug
        setError(data.error || `Error ${res.status}`)
        return
      }

      if (data.themes?.length > 0) {
        setPlan(data)
      } else {
        setError('No results — try a more specific query')
      }
    } catch (e) {
      setError('Network error — check console')
      console.error('[PromptBar]', e)
    } finally {
      clearInterval(ticker)
      setLoading(false)
      setValue('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const q = value.trim()
    if (!q || loading) return
    await runResearch(q)
  }

  async function handleRefine(instruction: string) {
    if (!plan) return
    setRefining(true)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `${plan.query} — ${instruction}` }),
      })
      const data = await res.json()
      if (res.ok && data.themes?.length > 0) {
        setPlan(data)
      }
    } finally {
      setRefining(false)
    }
  }

  return (
    <>
      {/* Floating prompt bar — dims when plan is open */}
      <div
        className={`
          absolute top-6 left-1/2 -translate-x-1/2 z-10
          transition-all duration-300 ease-out
          w-[calc(100vw-32px)] max-w-[520px]
          ${plan ? 'opacity-30 pointer-events-none' : 'opacity-100'}
        `}
      >
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            {/* Spinner / search icon */}
            <div className="absolute left-4 pointer-events-none text-white/40">
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={e => setValue(e.target.value)}
              onFocus={() => { setFocused(true); setError(null) }}
              onBlur={() => setFocused(false)}
              placeholder={loading ? loadingMsg : 'What do you want to map?'}
              disabled={loading}
              className={`
                w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm text-white placeholder-white/40
                bg-black/70 backdrop-blur-xl border transition-all duration-300
                focus:outline-none disabled:opacity-60
                ${focused ? 'border-white/30 bg-black/80' : 'border-white/15 hover:border-white/25'}
                ${error ? 'border-red-400/40' : ''}
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

        {/* Error message */}
        {error && (
          <p className="text-red-400/80 text-xs text-center mt-2 bg-black/60 rounded-lg px-3 py-1.5">
            {error}
          </p>
        )}

        {/* Hint / build manually link */}
        {focused && !loading && !error && (
          <p className="text-white/25 text-xs text-center mt-2">
            Try "weekend in Kyoto" or "best tacos in LA" — or{' '}
            <button
              type="button"
              className="text-white/40 hover:text-white/60 underline transition"
              onMouseDown={e => { e.preventDefault(); setActivePanel('building') }}
            >
              build manually
            </button>
          </p>
        )}
      </div>

      {/* Plan review panel */}
      {plan && (
        <PlanReviewPanel
          plan={plan}
          onClose={() => setPlan(null)}
          onRefine={handleRefine}
          refining={refining}
        />
      )}
    </>
  )
}
