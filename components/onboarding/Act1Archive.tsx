'use client'

import { useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ONBOARDING_IMAGES, COLUMN_OFFSETS } from '@/lib/onboarding-images'
import { useOnboardingStore } from '@/store/onboarding'

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
}

const imageVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] },
  },
}

const promptVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: 1.1, ease: 'easeOut' },
  },
}

const ctaVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Aspect ratio classes per span type
const SPAN_CLASSES: Record<string, string> = {
  tall: 'aspect-[3/4]',
  wide: 'aspect-[4/3]',
  square: 'aspect-square',
}

// Group images into 4 columns
const COLUMNS = [1, 2, 3, 4] as const
function getColumn(col: 1 | 2 | 3 | 4) {
  return ONBOARDING_IMAGES.filter((img) => img.col === col)
}

export default function Act1Archive({ onContinue }: { onContinue: () => void }) {
  const { selectedImageIds, toggleImageSelection } = useOnboardingStore()
  const selectionCount = selectedImageIds.length
  const allSelected = selectionCount === 3

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col">

      {/* Image grid — fills the screen */}
      <div className="flex-1 overflow-hidden relative">
        <motion.div
          className="h-full flex gap-2 px-3 pt-4 pb-20"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {COLUMNS.map((col) => (
            <div
              key={col}
              className="flex-1 flex flex-col gap-2"
              style={{ paddingTop: COLUMN_OFFSETS[col] }}
            >
              {getColumn(col).map((img) => {
                const isSelected = selectedImageIds.includes(img.id)
                const isLocked = !isSelected && allSelected

                return (
                  <motion.button
                    key={img.id}
                    layoutId={img.id}
                    variants={imageVariants}
                    onClick={() => !isLocked && toggleImageSelection(img.id)}
                    className={`
                      relative ${SPAN_CLASSES[img.span]} rounded-lg overflow-hidden
                      transition-all duration-300 cursor-pointer
                      ${isLocked ? 'cursor-not-allowed' : ''}
                    `}
                    style={{
                      opacity: isLocked ? 0.3 : isSelected ? 1 : allSelected ? 0.5 : 1,
                    }}
                    whileHover={!isLocked ? { scale: 1.02 } : {}}
                    whileTap={!isLocked ? { scale: 0.98 } : {}}
                  >
                    {/* Image */}
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />

                    {/* Selected overlay */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0 ring-2 ring-white ring-inset rounded-lg pointer-events-none"
                        />
                      )}
                    </AnimatePresence>

                    {/* Checkmark */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                          className="absolute bottom-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center"
                        >
                          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                            <path
                              d="M2 5l2.5 2.5L8 3"
                              stroke="#000"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              fill="none"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>
          ))}
        </motion.div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>

      {/* Bottom: prompt + CTA */}
      <div className="flex-shrink-0 flex flex-col items-center gap-5 pb-8 px-6">
        <motion.p
          variants={promptVariants}
          initial="hidden"
          animate="show"
          className="text-white/60 text-sm font-light text-center"
        >
          {allSelected
            ? 'Three chosen.'
            : selectionCount === 0
            ? 'Three of these feel right.'
            : selectionCount === 1
            ? 'Two more.'
            : 'One more.'}
        </motion.p>

        <AnimatePresence>
          {allSelected && (
            <motion.button
              variants={ctaVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
              onClick={onContinue}
              className="px-7 py-2.5 rounded-full bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Continue
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
