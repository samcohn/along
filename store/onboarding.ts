import { create } from 'zustand'

export interface OnboardingImage {
  id: string
  src: string
  alt: string
  mood: string[]
  width: number
  height: number
}

interface OnboardingState {
  // Act tracking
  actIndex: 0 | 1 | 2 | 3
  setActIndex: (i: 0 | 1 | 2 | 3) => void

  // Act 1: image selections
  selectedImageIds: string[]
  toggleImageSelection: (id: string) => void
  canSelectMore: boolean

  // Act 2: anchor
  anchorText: string
  setAnchorText: (t: string) => void

  // Act 3: edges (sub-steps)
  edgeSubStep: 0 | 1
  setEdgeSubStep: (s: 0 | 1) => void
  bucketListTrip: string
  setBucketListTrip: (t: string) => void
  hardConstraint: string
  setHardConstraint: (t: string) => void

  // Act 4: mirror
  tastePhrases: string[]
  setTastePhrases: (phrases: string[]) => void
  isClaudeRunning: boolean
  setIsClaudeRunning: (v: boolean) => void
  claudeFinished: boolean
  setClaudeFinished: (v: boolean) => void
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  actIndex: 0,
  setActIndex: (i) => set({ actIndex: i }),

  selectedImageIds: [],
  toggleImageSelection: (id) => {
    const current = get().selectedImageIds
    if (current.includes(id)) {
      set({ selectedImageIds: current.filter((x) => x !== id) })
    } else if (current.length < 3) {
      set({ selectedImageIds: [...current, id] })
    }
    // if already 3 selected and clicking a new one, do nothing
  },
  get canSelectMore() {
    return get().selectedImageIds.length < 3
  },

  anchorText: '',
  setAnchorText: (t) => set({ anchorText: t }),

  edgeSubStep: 0,
  setEdgeSubStep: (s) => set({ edgeSubStep: s }),
  bucketListTrip: '',
  setBucketListTrip: (t) => set({ bucketListTrip: t }),
  hardConstraint: '',
  setHardConstraint: (t) => set({ hardConstraint: t }),

  tastePhrases: [],
  setTastePhrases: (phrases) => set({ tastePhrases: phrases }),
  isClaudeRunning: false,
  setIsClaudeRunning: (v) => set({ isClaudeRunning: v }),
  claudeFinished: false,
  setClaudeFinished: (v) => set({ claudeFinished: v }),
}))
