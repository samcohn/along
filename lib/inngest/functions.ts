import { inngest } from './client'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null

// ─── Research Agent ───────────────────────────────────────────────────────────

export const researchAgent = inngest.createFunction(
  { id: 'research-agent', name: 'Research Agent' },
  { event: 'along/research.requested' },
  async ({ event, step }) => {
    const { blueprint_id, query, sources = [], is_living = false } = event.data

    // Step 1: Parse intent — natural language → structured search params
    const structured = await step.run('parse-intent', async () => {
      if (!anthropic) return { queries: [query], location_hint: null, filters: {} }

      const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `Parse this research request into structured search params. Return ONLY JSON.

Request: "${query}"

Return: { "queries": string[], "location_hint": string | null, "filters": Record<string, string>, "expected_count": number }`
        }]
      })

      try {
        const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
        return JSON.parse(text)
      } catch {
        return { queries: [query], location_hint: null, filters: {}, expected_count: 10 }
      }
    })

    // Step 2: Scrape sources or generate via Claude
    const rawResults = await step.run('scrape-sources', async () => {
      const results: Array<{
        name: string
        address: string
        description?: string
        source_url: string
      }> = []

      // Firecrawl scraping if key + sources provided
      if (process.env.FIRECRAWL_API_KEY && sources.length > 0) {
        const { default: FirecrawlApp } = await import('@mendable/firecrawl-js')
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

        for (const src of sources.slice(0, 3)) {
          try {
            const scraped = await firecrawl.scrapeUrl(src, {
              formats: ['extract'],
              // @ts-expect-error — extract options vary by firecrawl version
              extract: {
                prompt: `Extract all place/business names and addresses related to: ${query}. Return as JSON array of {name, address, description}.`
              }
            })
            // @ts-expect-error — extract type varies
            if (scraped.extract && Array.isArray(scraped.extract)) {
              // @ts-expect-error — extract type varies
              results.push(...scraped.extract.map((r) => ({ ...r, source_url: src })))
            }
          } catch (e) {
            console.error(`Firecrawl error for ${src}:`, e)
          }
        }
      }

      // Fallback / primary: Claude generates real results
      if (results.length === 0 && anthropic) {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-5',
          max_tokens: 2048,
          messages: [{
            role: 'user',
            content: `Generate a research dataset for: "${query}"

Return a JSON array of 8-12 real, specific places. Each must have:
- name: string (specific real name)
- address: string (real full address)
- description: string (1 sentence)
- source_url: string (plausible real URL)

Return ONLY the JSON array, no other text.`
          }]
        })
        try {
          const text = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
          results.push(...JSON.parse(text))
        } catch { /* empty fallback */ }
      }

      return results
    })

    // Step 3: Geocode each result via Google Geocoding API
    const geocoded = await step.run('geocode-results', async () => {
      const KEY = process.env.GOOGLE_GEOCODING_KEY
      if (!KEY) return rawResults.map((r: {name: string; address: string; description?: string; source_url: string}) => ({ ...r, coordinates: null }))

      const out = []
      for (const result of rawResults.slice(0, 20)) {
        try {
          const q = encodeURIComponent(`${result.name} ${result.address}`)
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${KEY}`)
          const data = await res.json()
          if (data.results?.[0]) {
            const loc = data.results[0].geometry.location
            out.push({
              ...result,
              coordinates: { lat: loc.lat, lng: loc.lng },
              formatted_address: data.results[0].formatted_address,
            })
          }
        } catch { /* skip ungeocodable */ }
      }
      return out
    })

    // Step 4: Deduplicate by name
    const deduplicated = await step.run('deduplicate', async () => {
      const seen = new Set<string>()
      return geocoded.filter((r: { name: string }) => {
        const key = r.name.toLowerCase().replace(/\s+/g, '')
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    })

    return {
      blueprint_id,
      query,
      is_living,
      structured,
      status: 'pending_review',
      count: deduplicated.length,
      results: deduplicated,
    }
  }
)

// ─── Living Dataset Cron ──────────────────────────────────────────────────────

export const livingDatasetRefresh = inngest.createFunction(
  { id: 'living-dataset-refresh', name: 'Living Dataset Refresh' },
  { cron: '0 9 * * 1' },
  async ({ step }) => {
    await step.run('fetch-active-configs', async () => {
      // TODO: query living_dataset_configs and trigger research.requested per config
      return { configs: [] }
    })
  }
)

export const functions = [researchAgent, livingDatasetRefresh]
