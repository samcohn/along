'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Answer {
  question_id: string
  question: string
  answer: string
}

interface Step {
  id: string
  type: 'destination' | 'free_text' | 'choice_cards' | 'companions'
  question: string
  subtext?: string
  placeholder?: string
  choices?: { id: string; label: string; sub: string; emoji: string }[]
}

// ─── Steps: 2-step (profile exists) or 6-step (no profile / legacy) ──────────

// Short version — shown when user already has a taste profile from onboarding
const SHORT_STEPS: Step[] = [
  {
    id: 'pull',
    type: 'free_text',
    question: 'What\'s calling you right now?',
    subtext: 'A feeling, a craving, a restlessness. Whatever it is.',
    placeholder: 'I want somewhere that feels...',
  },
  {
    id: 'destination',
    type: 'destination',
    question: 'Where?',
    subtext: 'A city, a country, or even just a direction.',
    placeholder: 'Tokyo, coastal Portugal, somewhere cold...',
  },
]

// Full version — fallback if no profile (should rarely appear after onboarding gate)
const FULL_STEPS: Step[] = [
  {
    id: 'destination',
    type: 'destination',
    question: 'Where are you going?',
    subtext: 'A city, a country, or even just a feeling.',
    placeholder: 'Tokyo, coastal Portugal, somewhere cold...',
  },
  {
    id: 'restaurant',
    type: 'free_text',
    question: 'Name a restaurant — anywhere in the world — where you felt completely at home.',
    subtext: 'Could be a three-star, a counter with six seats, a food stall. What mattered was how it felt.',
    placeholder: 'The name, and why it stays with you...',
  },
  {
    id: 'cultural_anchor',
    type: 'free_text',
    question: 'An artist, musician, filmmaker, or writer whose world you\'d want to live inside for a week.',
    subtext: 'Not your favorite. The one whose aesthetic you\'d move into.',
    placeholder: 'Name and what draws you to them...',
  },
  {
    id: 'movement',
    type: 'choice_cards',
    question: 'How do you move through a new city?',
    subtext: 'Be honest — there\'s no wrong answer.',
    choices: [
      { id: 'wander', emoji: '🌀', label: 'I follow instinct', sub: 'No plan. The wrong turn is the right turn. I want to get lost.' },
      { id: 'anchored', emoji: '⚓', label: 'I pick a base', sub: 'One neighborhood, deeply. Day trips out. I come back to the same café.' },
      { id: 'collector', emoji: '📍', label: 'I research first', sub: 'I have a list. I\'ve read the piece. I know which table I want.' },
    ],
  },
  {
    id: 'morning',
    type: 'free_text',
    question: 'What does a perfect morning abroad look like?',
    subtext: 'Walk me through it. The earlier decisions reveal the most.',
    placeholder: 'Wake up at... then...',
  },
  {
    id: 'constraint',
    type: 'free_text',
    question: 'One thing you never want to do on this trip.',
    subtext: 'Constraints are just as revealing as preferences.',
    placeholder: 'No tours, no tourist traps, no...',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

// Props allow passing profile existence from server component
interface TripIntakeProps {
  hasProfile?: boolean
}

export default function TripIntake({ hasProfile = true }: TripIntakeProps) {
  const router = useRouter()
  // Use short steps when profile exists (onboarding done), full otherwise
  const STEPS = hasProfile ? SHORT_STEPS : FULL_STEPS
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [draft, setDraft] = useState('')
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null)
  const [building, setBuilding] = useState(false)
  const [buildingMsg, setBuildingMsg] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1
  const progress = (stepIndex / STEPS.length) * 100

  // Auto-focus input on step change
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120)
    setDraft('')
    setSelectedChoice(null)
  }, [stepIndex])

  function canAdvance() {
    if (step.type === 'choice_cards') return !!selectedChoice
    return draft.trim().length > 2
  }

  function advance() {
    const answer = step.type === 'choice_cards' ? (selectedChoice ?? '') : draft.trim()
    const newAnswers = [...answers, { question_id: step.id, question: step.question, answer }]
    setAnswers(newAnswers)

    if (isLast) {
      submitIntake(newAnswers)
    } else {
      setStepIndex(i => i + 1)
    }
  }

  async function submitIntake(finalAnswers: Answer[]) {
    setBuilding(true)

    const messages = [
      'Reading between the lines…',
      'Understanding who you are…',
      'Mapping your aesthetic…',
      'Finding the right places…',
      'Building your world…',
    ]
    let i = 0
    setBuildingMsg(messages[0])
    const ticker = setInterval(() => {
      i++
      setBuildingMsg(messages[Math.min(i, messages.length - 1)])
    }, 3000)

    try {
      const res = await fetch('/api/trips/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers }),
      })
      const data = await res.json()
      clearInterval(ticker)

      if (data.trip_intent_id) {
        // Route to the scoping step (scope options view)
        router.push(`/app/trip/${data.trip_intent_id}/scope`)
      } else {
        router.push('/app/new/map')
      }
    } catch {
      clearInterval(ticker)
      setBuilding(false)
    }
  }

  // ── Building screen ───────────────────────────────────────────────────────
  if (building) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-white/10 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-white/20 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-white/40" />
        </div>
        <p className="text-white/60 text-sm font-light tracking-wide transition-all duration-700">{buildingMsg}</p>
      </div>
    )
  }

  // ── Intake screen ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col">

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5">
        <div
          className="h-full bg-white/30 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar: back nav */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5">
        {stepIndex === 0 ? (
          <Link
            href="/app"
            className="text-white/20 hover:text-white/50 transition text-sm"
          >
            ← Along
          </Link>
        ) : (
          <button
            onClick={() => setStepIndex(i => i - 1)}
            className="text-white/25 hover:text-white/60 transition text-sm"
          >
            ← back
          </button>
        )}
        <span className="text-white/20 text-xs">{stepIndex + 1} / {STEPS.length}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-2xl mx-auto w-full">

        {/* Question */}
        <div className="w-full mb-10">
          <h2 className="text-white text-2xl sm:text-3xl font-light leading-snug mb-3">
            {step.question}
          </h2>
          {step.subtext && (
            <p className="text-white/35 text-sm leading-relaxed">{step.subtext}</p>
          )}
        </div>

        {/* Input area */}
        {step.type === 'choice_cards' && step.choices ? (
          <div className="w-full flex flex-col gap-3">
            {step.choices.map(choice => (
              <button
                key={choice.id}
                onClick={() => setSelectedChoice(choice.id)}
                className={`
                  flex items-start gap-4 p-4 rounded-2xl border text-left transition-all
                  ${selectedChoice === choice.id
                    ? 'bg-white/12 border-white/30'
                    : 'bg-white/4 border-white/8 hover:bg-white/7 hover:border-white/15'}
                `}
              >
                <span className="text-2xl flex-shrink-0 mt-0.5">{choice.emoji}</span>
                <div>
                  <p className="text-white font-medium text-sm">{choice.label}</p>
                  <p className="text-white/40 text-xs mt-1 leading-relaxed">{choice.sub}</p>
                </div>
                {selectedChoice === choice.id && (
                  <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center mt-0.5">
                    <svg viewBox="0 0 10 10" className="w-3 h-3">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : step.id === 'destination' ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && canAdvance()) advance() }}
            placeholder={step.placeholder}
            className="w-full bg-transparent border-b border-white/20 focus:border-white/50 text-white text-xl font-light py-3 focus:outline-none placeholder-white/20 transition-colors"
          />
        ) : (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && e.metaKey && canAdvance()) advance() }}
            placeholder={step.placeholder}
            rows={3}
            className="w-full bg-white/4 border border-white/10 focus:border-white/25 text-white text-base font-light rounded-2xl p-4 focus:outline-none placeholder-white/20 transition-colors resize-none leading-relaxed"
          />
        )}

        {/* Continue button */}
        <div className="w-full mt-8 flex items-center justify-between">
          <p className="text-white/15 text-xs">
            {step.type === 'free_text' && step.id !== 'destination' ? '⌘↵ to continue' : ''}
          </p>
          <button
            onClick={advance}
            disabled={!canAdvance()}
            className={`
              px-6 py-2.5 rounded-xl text-sm font-medium transition-all
              ${canAdvance()
                ? 'bg-white text-black hover:bg-white/90'
                : 'bg-white/8 text-white/20 cursor-not-allowed'}
            `}
          >
            {isLast ? 'Build my trip' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Answered questions — subtle trail below */}
      {answers.length > 0 && (
        <div className="flex-shrink-0 px-8 pb-4 flex flex-wrap gap-2 justify-center max-w-2xl mx-auto w-full">
          {answers.slice(-3).map(a => (
            <div key={a.question_id} className="bg-white/4 border border-white/6 rounded-full px-3 py-1 flex items-center gap-2 max-w-xs">
              <span className="text-white/20 text-[10px] truncate">{a.answer.slice(0, 40)}{a.answer.length > 40 ? '…' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Escape hatch: blank map */}
      <div className="flex-shrink-0 pb-8 text-center">
        <Link
          href="/app/new/map"
          className="text-white/15 hover:text-white/35 text-xs transition-colors"
        >
          Skip — just open a blank map
        </Link>
      </div>
    </div>
  )
}
