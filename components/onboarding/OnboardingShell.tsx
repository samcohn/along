'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingStore } from '@/store/onboarding'
import Act1Archive from './Act1Archive'
import Act2Anchor from './Act2Anchor'
import Act3Edges from './Act3Edges'
import Act4Mirror from './Act4Mirror'

const ACT_LABELS = ['Archive', 'Anchor', 'Edges', 'Mirror']

const actVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, x: -40, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function OnboardingShell() {
  const {
    actIndex, setActIndex,
    selectedImageIds, anchorText, bucketListTrip, hardConstraint,
    setTastePhrases, setIsClaudeRunning, setClaudeFinished,
  } = useOnboardingStore()

  // Fire Claude call when Act 3 completes, transition to Act 4 immediately
  const handleAct3Complete = useCallback(async () => {
    setActIndex(3)
    setIsClaudeRunning(true)

    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageSelections: selectedImageIds,
          anchorText,
          bucketListTrip,
          hardConstraint,
        }),
      })
      const data = await res.json()
      if (data.taste_phrases) {
        setTastePhrases(data.taste_phrases)
      }
    } catch (err) {
      console.error('Onboarding API error:', err)
      // Fallback phrases so the mirror isn't empty
      setTastePhrases([
        'You want somewhere that hasn\'t been optimized.',
        'The counter, not the table.',
        'Mornings matter more than nights.',
      ])
    } finally {
      setIsClaudeRunning(false)
      setClaudeFinished(true)
    }
  }, [
    selectedImageIds, anchorText, bucketListTrip, hardConstraint,
    setActIndex, setTastePhrases, setIsClaudeRunning, setClaudeFinished,
  ])

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]">

      {/* Progress bar — top 1px */}
      <div className="absolute top-0 left-0 right-0 h-px bg-white/5 z-50">
        <motion.div
          className="h-full bg-white/25"
          animate={{ width: `${((actIndex + 1) / 4) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        />
      </div>

      {/* Act counter — top right, subtle */}
      {actIndex < 3 && (
        <div className="absolute top-5 right-6 z-50 text-white/20 text-[11px] tracking-wide">
          {ACT_LABELS[actIndex]}
        </div>
      )}

      {/* Acts — AnimatePresence handles enter/exit */}
      <AnimatePresence mode="wait">
        {actIndex === 0 && (
          <motion.div key="act1" {...actVariants} className="fixed inset-0">
            <Act1Archive onContinue={() => setActIndex(1)} />
          </motion.div>
        )}

        {actIndex === 1 && (
          <motion.div key="act2" {...actVariants} className="fixed inset-0">
            <Act2Anchor onContinue={() => setActIndex(2)} />
          </motion.div>
        )}

        {actIndex === 2 && (
          <motion.div key="act3" {...actVariants} className="fixed inset-0">
            <Act3Edges onComplete={handleAct3Complete} />
          </motion.div>
        )}

        {actIndex === 3 && (
          <motion.div key="act4" {...actVariants} className="fixed inset-0">
            {/* Act4Mirror needs layoutId images from Act1 — render Act1 images invisibly
                so Framer Motion can track their layout positions for the animation */}
            <Act4Mirror />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
