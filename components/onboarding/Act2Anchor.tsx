'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useOnboardingStore } from '@/store/onboarding'

export default function Act2Anchor({ onContinue }: { onContinue: () => void }) {
  const { anchorText, setAnchorText } = useOnboardingStore()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input after question animates in
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 900)
    return () => clearTimeout(t)
  }, [])

  const canContinue = anchorText.trim().length > 2

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center px-8">
      <div className="max-w-xl w-full">

        {/* Main question */}
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-white text-2xl sm:text-3xl font-light leading-snug mb-4"
        >
          Name something whose world you&apos;d move into for a week.
        </motion.h2>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-white/30 text-sm mb-10 leading-relaxed"
        >
          A film. A restaurant. A record. A building. Anything.
        </motion.p>

        {/* Input — appears after question settles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={anchorText}
            onChange={(e) => setAnchorText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canContinue) onContinue() }}
            className="w-full bg-transparent border-b border-white/20 focus:border-white/50 text-white text-xl font-light py-3 focus:outline-none transition-colors placeholder-transparent"
            // No placeholder — the cursor IS the prompt
            autoComplete="off"
            spellCheck={false}
          />
        </motion.div>

        {/* CTA — appears once typing starts */}
        <motion.div
          className="mt-10 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: canContinue ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <button
            onClick={onContinue}
            disabled={!canContinue}
            className="px-6 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:pointer-events-none"
          >
            Continue
          </button>
        </motion.div>
      </div>
    </div>
  )
}
