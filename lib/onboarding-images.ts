// Onboarding image manifest — 12 curated placeholder images
// Source: Unsplash (CC0 / free to use). Replace with hand-curated set.
// Each image covers a distinct mood/texture/density combination so
// Claude can infer aesthetic identity from the 3 chosen.
//
// Mood taxonomy:
//   narrow     — tight alley, enclosed space, compressed perspective
//   open       — wide horizon, vast scale, breathing room
//   ancient    — visible history, weathered, pre-modern
//   contemporary — clean, modern, designed
//   communal   — people present or implied, social energy
//   solitary   — no people, stillness, private feeling
//   warm-light — golden, amber, evening or morning sun
//   cool-light — blue, grey, overcast, diffuse
//   interior   — inside, domestic, contained
//   exterior   — outside, public, urban or natural
//   coastal    — water, sea, marine texture
//   urban      — city fabric, concrete, infrastructure

export interface OnboardingImage {
  id: string
  src: string          // URL (Unsplash CDN or local /images/onboarding/)
  alt: string          // screen reader description
  mood: string[]       // taxonomy tags used by Claude to read the selection
  // Layout hints for the masonry grid
  span: 'tall' | 'wide' | 'square'   // aspect ratio family
  col: 1 | 2 | 3 | 4  // preferred column (loose, not strict)
  rowOffset?: number   // vertical offset in px for organic feel
}

export const ONBOARDING_IMAGES: OnboardingImage[] = [
  {
    id: 'narrow-venice',
    src: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=600&q=80',
    alt: 'A narrow canal in Venice at dusk, reflections on still water',
    mood: ['narrow', 'ancient', 'communal', 'warm-light', 'exterior'],
    span: 'tall',
    col: 1,
    rowOffset: 0,
  },
  {
    id: 'open-iceland',
    src: 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=600&q=80',
    alt: 'A vast Icelandic landscape, lone road across a lava plain',
    mood: ['open', 'solitary', 'contemporary', 'cool-light', 'exterior'],
    span: 'wide',
    col: 2,
    rowOffset: 0,
  },
  {
    id: 'interior-library',
    src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
    alt: 'A hushed reading room inside a grand old library, warm lamplight',
    mood: ['interior', 'ancient', 'solitary', 'warm-light', 'narrow'],
    span: 'tall',
    col: 3,
    rowOffset: 20,
  },
  {
    id: 'communal-market',
    src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    alt: 'A crowded covered market, stalls of produce, warm artificial light',
    mood: ['communal', 'interior', 'warm-light', 'dense', 'contemporary'],
    span: 'square',
    col: 4,
    rowOffset: 40,
  },
  {
    id: 'coastal-cliff',
    src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
    alt: 'A coastal cliff path in southern Europe, blue sea below, stark light',
    mood: ['coastal', 'open', 'solitary', 'warm-light', 'exterior'],
    span: 'wide',
    col: 1,
    rowOffset: 10,
  },
  {
    id: 'urban-brutalist',
    src: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    alt: 'A brutalist concrete plaza, single shaft of morning light, no people',
    mood: ['urban', 'contemporary', 'solitary', 'cool-light', 'exterior', 'open'],
    span: 'tall',
    col: 2,
    rowOffset: 30,
  },
  {
    id: 'narrow-souk',
    src: 'https://images.unsplash.com/photo-1539020140153-e479b8831a2b?w=600&q=80',
    alt: 'A narrow souk passage in Morocco, shafts of light, vivid colour',
    mood: ['narrow', 'ancient', 'communal', 'warm-light', 'interior'],
    span: 'tall',
    col: 3,
    rowOffset: 0,
  },
  {
    id: 'open-japan',
    src: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=600&q=80',
    alt: 'A Japanese garden at dawn, raked gravel, mist, stillness',
    mood: ['open', 'ancient', 'solitary', 'cool-light', 'exterior'],
    span: 'wide',
    col: 4,
    rowOffset: 0,
  },
  {
    id: 'interior-cafe',
    src: 'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80',
    alt: 'A small café corner in Paris, marble table, window light, espresso cup',
    mood: ['interior', 'communal', 'warm-light', 'contemporary', 'narrow'],
    span: 'square',
    col: 1,
    rowOffset: 50,
  },
  {
    id: 'urban-night',
    src: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
    alt: 'A city at night from above, grid of lights, dense and vast',
    mood: ['urban', 'open', 'communal', 'contemporary', 'exterior'],
    span: 'wide',
    col: 2,
    rowOffset: 20,
  },
  {
    id: 'ancient-ruins',
    src: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
    alt: 'Ancient Roman ruins at dusk, amber stone, long shadows, no tourists',
    mood: ['ancient', 'open', 'solitary', 'warm-light', 'exterior'],
    span: 'tall',
    col: 3,
    rowOffset: 40,
  },
  {
    id: 'coastal-fishing',
    src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    alt: 'A quiet fishing village, pastel buildings reflected in harbour water',
    mood: ['coastal', 'communal', 'warm-light', 'exterior', 'contemporary'],
    span: 'wide',
    col: 4,
    rowOffset: 60,
  },
]

// Column layout config for the masonry grid
// Each column gets a y-offset to create the organic stagger
export const COLUMN_OFFSETS = { 1: 0, 2: 48, 3: 20, 4: 72 }
