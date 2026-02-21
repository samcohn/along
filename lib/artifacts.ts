// Met Open Access API client for floating map artifacts
// Docs: https://metmuseum.github.io/
// No API key required. CC0 public domain images.

const MET_BASE = 'https://collectionapi.metmuseum.org/public/collection/v1'

// In-memory cache: key = "culture|category" → MetArtifact
const cache = new Map<string, MetArtifact | null>()

export interface MetArtifact {
  objectID: number
  title: string
  objectName: string
  imageUrl: string       // primaryImage (JPEG, neutral/white bg)
  culture: string
  period: string
  medium: string
  date: string
  metUrl: string
}

// category → Met department ID + search term
const CATEGORY_MAP: Record<string, { dept: number; q: string }> = {
  restaurant:     { dept: 6,  q: 'vessel bowl ceramic' },
  bar:            { dept: 6,  q: 'vessel cup drinking' },
  cafe:           { dept: 6,  q: 'vessel cup tea' },
  architecture:   { dept: 13, q: 'architectural fragment column capital' },
  landmark:       { dept: 13, q: 'relief monument sculpture' },
  museum:         { dept: 11, q: 'painting interior gallery' },
  gallery:        { dept: 11, q: 'painting frame' },
  temple:         { dept: 14, q: 'religious object altar ceremonial' },
  church:         { dept: 15, q: 'religious sculpture icon' },
  market:         { dept: 20, q: 'textile weaving pattern' },
  shop:           { dept: 12, q: 'decorative object craft' },
  hotel:          { dept: 12, q: 'furniture domestic chair table' },
  accommodation:  { dept: 12, q: 'furniture bed chamber' },
  park:           { dept: 3,  q: 'botanical garden plant flower' },
  garden:         { dept: 6,  q: 'garden landscape nature ceramic' },
  museum_art:     { dept: 11, q: 'painting masterwork' },
  nightlife:      { dept: 17, q: 'musical instrument performance' },
  transport:      { dept: 5,  q: 'armor vehicle weapon' },
  beach:          { dept: 8,  q: 'oceanic vessel canoe boat' },
  viewpoint:      { dept: 13, q: 'landscape horizon vista sculpture' },
}

function getCategoryConfig(category: string): { dept: number; q: string } {
  const normalized = category.toLowerCase().replace(/[^a-z]/g, '_')
  return CATEGORY_MAP[normalized] ?? { dept: 13, q: 'object artifact' }
}

// Culture name → search term (some cultures need expansion)
function normalizeCulture(culture: string): string {
  const map: Record<string, string> = {
    'italian': 'Roman Italian',
    'french': 'French',
    'japanese': 'Japanese',
    'chinese': 'Chinese',
    'greek': 'Greek ancient',
    'roman': 'Roman',
    'egyptian': 'Egyptian ancient',
    'spanish': 'Spanish',
    'indian': 'Indian',
    'thai': 'Thai Southeast Asian',
    'moroccan': 'Moroccan Islamic',
    'turkish': 'Turkish Ottoman',
    'dutch': 'Dutch Flemish',
    'american': 'American',
    'british': 'British English',
  }
  const lower = culture.toLowerCase()
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val
  }
  return culture
}

async function metSearch(q: string, departmentId: number, limit = 10): Promise<number[]> {
  const params = new URLSearchParams({
    q,
    departmentId: String(departmentId),
    hasImages: 'true',
    isPublicDomain: 'true',
  })
  const res = await fetch(`${MET_BASE}/search?${params}`, {
    next: { revalidate: 86400 }, // cache 24h in Next.js
  })
  if (!res.ok) return []
  const json = await res.json()
  return (json.objectIDs ?? []).slice(0, limit) as number[]
}

async function metGetObject(id: number): Promise<MetArtifact | null> {
  const res = await fetch(`${MET_BASE}/objects/${id}`, {
    next: { revalidate: 86400 },
  })
  if (!res.ok) return null
  const obj = await res.json()
  if (!obj.primaryImage || !obj.isPublicDomain) return null

  return {
    objectID: obj.objectID,
    title: obj.title || 'Untitled',
    objectName: obj.objectName || '',
    imageUrl: obj.primaryImage,
    culture: obj.culture || '',
    period: obj.period || '',
    medium: obj.medium || '',
    date: obj.objectDate || '',
    metUrl: obj.objectURL || `https://www.metmuseum.org/art/collection/search/${obj.objectID}`,
  }
}

/**
 * Fetch a museum artifact for a given place category + culture.
 * Returns null if nothing suitable found.
 * Results are cached in memory for the lifetime of the server process.
 */
export async function fetchArtifactForPlace(opts: {
  culture: string
  category: string
  period?: string
}): Promise<MetArtifact | null> {
  const { culture, category } = opts
  const cacheKey = `${culture.toLowerCase()}|${category.toLowerCase()}`

  if (cache.has(cacheKey)) return cache.get(cacheKey) ?? null

  const { dept, q: baseQ } = getCategoryConfig(category)
  const cultureTerm = normalizeCulture(culture)
  const searchQ = `${cultureTerm} ${baseQ}`

  try {
    const objectIds = await metSearch(searchQ, dept, 15)

    // Try each object until we find one with a usable image
    for (const id of objectIds) {
      const artifact = await metGetObject(id)
      if (artifact?.imageUrl) {
        cache.set(cacheKey, artifact)
        return artifact
      }
    }

    // Fallback: search just by culture without category constraint
    const fallbackIds = await metSearch(cultureTerm, dept, 10)
    for (const id of fallbackIds) {
      const artifact = await metGetObject(id)
      if (artifact?.imageUrl) {
        cache.set(cacheKey, artifact)
        return artifact
      }
    }

    cache.set(cacheKey, null)
    return null
  } catch (err) {
    console.error(`fetchArtifactForPlace error (${cacheKey}):`, err)
    cache.set(cacheKey, null)
    return null
  }
}
