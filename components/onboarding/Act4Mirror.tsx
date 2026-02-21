'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { ONBOARDING_IMAGES } from '@/lib/onboarding-images'
import { useOnboardingStore } from '@/store/onboarding'

// Three positions for the selected images in the loose triangle arrangement
const MIRROR_POSITIONS = [
  { x: '-15%', y: '-8%', rotate: -2 },   // left
  { x: '15%',  y: '-14%', rotate: 1.5 }, // right
  { x: '0%',   y: '12%',  rotate: -1 },  // bottom center
]

// Breathing animation — each image oscillates on a different phase
const BREATHE_VARIANTS = [
  { y: [0, -5, 0], transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' } },
  { y: [0, -4, 0], transition: { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 } },
  { y: [0, -6, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1.4 } },
]

export default function Act4Mirror() {
  const { selectedImageIds, tastePhrases, claudeFinished } = useOnboardingStore()

  const [phase, setPhase] = useState<'arrange' | 'breathe' | 'phrases' | 'done'>('arrange')
  const [visiblePhrases, setVisiblePhrases] = useState<number>(0)
  const [showFinal, setShowFinal] = useState(false)
  const [showCTA, setShowCTA] = useState(false)
  const phraseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedImages = selectedImageIds
    .map((id) => ONBOARDING_IMAGES.find((img) => img.id === id))
    .filter(Boolean) as typeof ONBOARDING_IMAGES

  // Phase 1 → 2: images have arrived, start breathing after 1.8s
  useEffect(() => {
    const t = setTimeout(() => setPhase('breathe'), 1800)
    return () => clearTimeout(t)
  }, [])

  // Phase 2 → 3: move to phrases phase once Claude responds AND breathe has run ≥3s
  const breatheStartRef = useRef(Date.now())
  useEffect(() => {
    if (phase !== 'breathe') return
    breatheStartRef.current = Date.now()
  }, [phase])

  useEffect(() => {
    if (!claudeFinished || phase === 'phrases' || phase === 'done') return

    const elapsed = Date.now() - breatheStartRef.current
    const minBreathe = 3000 // at least 3s of breathing
    const remaining = Math.max(0, minBreathe - elapsed)

    const t = setTimeout(() => setPhase('phrases'), remaining)
    return () => clearTimeout(t)
  }, [claudeFinished, phase])

  // Phase 3: reveal phrases one by one
  useEffect(() => {
    if (phase !== 'phrases' || !tastePhrases.length) return

    let count = 0
    function revealNext() {
      count++
      setVisiblePhrases(count)
      if (count < tastePhrases.length) {
        phraseTimerRef.current = setTimeout(revealNext, 700)
      } else {
        // All phrases revealed — show final line then CTA
        setTimeout(() => setShowFinal(true), 800)
        setTimeout(() => setShowCTA(true), 1600)
      }
    }

    phraseTimerRef.current = setTimeout(revealNext, 400)
    return () => {
      if (phraseTimerRef.current) clearTimeout(phraseTimerRef.current)
    }
  }, [phase, tastePhrases])

  return (
    <div className="fixed inset-0 bg-[#080808] flex flex-col items-center justify-center overflow-hidden">

      {/* Ambient glow behind images */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.15 }}
        transition={{ duration: 2.5, delay: 0.5 }}
        className="absolute w-[500px] h-[500px] rounded-full bg-white/10 blur-[120px] pointer-events-none"
      />

      {/* Selected images — float into triangle formation */}
      <div className="relative w-[520px] h-[360px] flex-shrink-0">
        {selectedImages.map((img, i) => {
          const pos = MIRROR_POSITIONS[i]
          const breathe = BREATHE_VARIANTS[i]
          return (
            <motion.div
              key={img.id}
              layoutId={img.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%)`,
                width: 180,
              }}
              animate={{
                x: pos.x,
                y: pos.y,
                rotate: pos.rotate,
              }}
              transition={{
                duration: 1.2,
                ease: [0.34, 1.2, 0.64, 1],  // spring-ish
                delay: i * 0.15,
              }}
            >
              {/* Breathing wrapper */}
              <motion.div
                animate={phase === 'breathe' || phase === 'phrases' ? breathe : {}}
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full rounded-xl object-cover shadow-2xl"
                  style={{ aspectRatio: img.span === 'tall' ? '3/4' : img.span === 'wide' ? '4/3' : '1/1' }}
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          )
        })}
      </div>

      {/* Phrases + final line */}
      <div className="mt-8 max-w-sm w-full px-6 flex flex-col items-center gap-3">
        <AnimatePresence>
          {tastePhrases.slice(0, visiblePhrases).map((phrase, i) => (
            <motion.p
              key={phrase}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-white/60 text-sm text-center leading-relaxed font-light"
            >
              &ldquo;{phrase}&rdquo;
            </motion.p>
          ))}
        </AnimatePresence>

        {/* Placeholder phrases while Claude runs (if no phrases yet) */}
        {phase === 'breathe' && !tastePhrases.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col items-center gap-1.5"
          >
            {[40, 56, 36].map((w, i) => (
              <motion.div
                key={i}
                className="h-px bg-white/10 rounded-full"
                style={{ width: w }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </motion.div>
        )}

        {/* Final statement */}
        <AnimatePresence>
          {showFinal && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-white text-base text-center leading-relaxed font-light mt-4"
            >
              This is who you are when you travel.
              <br />
              <span className="text-white/50">Along will remember this.</span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="mt-6"
            >
              <Link
                href="/app/new"
                className="px-7 py-3 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
              >
                Start your first trip →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
