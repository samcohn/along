import { inngest } from './client'

// ─── Placeholder: Research Agent ─────────────────────────────────────────────
// Runs the scrape-geocode-deduplicate pipeline for Mode 1 (Build with AI)

export const researchAgent = inngest.createFunction(
  { id: 'research-agent', name: 'Research Agent' },
  { event: 'along/research.requested' },
  async ({ event, step }) => {
    const { blueprint_id, query, sources } = event.data

    // Step 1: Parse intent
    const parsedQuery = await step.run('parse-intent', async () => {
      // TODO: call Claude to convert natural language query to structured search params
      return { query, sources, structured: true }
    })

    // Step 2: Scrape sources
    const rawResults = await step.run('scrape-sources', async () => {
      // TODO: Firecrawl / Playwright scraping
      return { results: [], blueprint_id, parsedQuery }
    })

    // Step 3: Geocode results
    const geocoded = await step.run('geocode-results', async () => {
      // TODO: Google Geocoding API
      return { results: rawResults.results }
    })

    // Step 4: Deduplicate
    const deduplicated = await step.run('deduplicate', async () => {
      // TODO: embedding similarity check against existing Blueprint entries
      return { results: geocoded.results }
    })

    // Step 5: Surface to triage UI (write to DB with status=pending_review)
    await step.run('write-to-triage', async () => {
      // TODO: insert into locations table with source attribution
      return { count: deduplicated.results.length }
    })

    return { blueprint_id, count: deduplicated.results.length }
  }
)

// ─── Placeholder: Living Dataset Cron ────────────────────────────────────────
// Scheduled re-run of the research agent for living datasets

export const livingDatasetRefresh = inngest.createFunction(
  { id: 'living-dataset-refresh', name: 'Living Dataset Refresh' },
  { cron: '0 9 * * 1' }, // default: every Monday 9am — overridden per config
  async ({ step }) => {
    // TODO: fetch all active living_dataset_configs and trigger research.requested per config
    await step.run('fetch-active-configs', async () => {
      return { configs: [] }
    })
  }
)

export const functions = [researchAgent, livingDatasetRefresh]
