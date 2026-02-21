'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/store/onboarding'

const CARDS = [
  {
    id: 0 as const,
    question: 'The trip that would make a story forever.',
    subtext: 'The one you\'d still be telling in thirty years.',
    placeholder: 'A week in...',
  },
  {
    id: 1 as const,
    question: 'One thing you never want on a trip.',
    subtext: 'Constraints are as revealing as preferences.',
    placeholder: 'No tours, no...',
  },
]

export default function Act3Edges({ onComplete }: { onComplete: () => void }) {
  const {
    edgeSubStep, setEdgeSubStep,
    bucketListTrip, setBucketListTrip,
    hardConstraint, setHardConstraint,
  } = useOnboardingStore()

  const inputRef = useRef<HTMLTextAreaElement>(null)

  const card = CARDS[edgeSubStep]
  const value = edgeSubStep === 0 ? bucketListTrip : hardConstraint
  const setValue = edgeSubStep === 0 ? setBucketListTrip : setHardConstraint
  const canContinue = value.trim().length > 2

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300)
    return () => clearTimeout(t)
  }, [edgeSubStep])

  function handleContinue() {
    if (!canContinue) return
    if (edgeSubStep === 0) {
      setEdgeSubStep(1)
    } else {
      onComplete()
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8">
      <div className="max-w-xl w-full">

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-12">
          {CARDS.map((c) => (
            <div
              key={c.id}
              className={`h-px flex-1 transition-all duration-500 ${
                c.id <= edgeSubStep ? 'bg-white/50' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={edgeSubStep}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <h2 className="text-white text-2xl sm:text-3xl font-light leading-snug mb-3">
              {card.question}
            </h2>
            <p className="text-white/30 text-sm mb-8 leading-relaxed">
              {card.subtext}
            </p>

            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.metaKey && canContinue) handleContinue()
              }}
              placeholder={card.placeholder}
              rows={3}
              className="w-full bg-white/[0.04] border border-white/10 focus:border-white/25 text-white text-base font-light rounded-2xl p-4 focus:outline-none placeholder-white/20 transition-colors resize-none leading-relaxed"
            />

            <div className="mt-6 flex items-center justify-between">
              <p className="text-white/15 text-xs">⌘↵ to continue</p>
              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                  canContinue
                    ? 'bg-white text-black hover:bg-white/90'
                    : 'bg-white/[0.07] text-white/20 cursor-not-allowed'
                }`}
              >
                {edgeSubStep === 0 ? 'Continue' : 'Build my profile'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
