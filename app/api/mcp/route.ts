/**
 * Along MCP (Model Context Protocol) endpoint — stub
 *
 * MCP is the emerging standard for AI agents to access external tools and data.
 * Anthropic open-sourced MCP in Nov 2024; now adopted by Amadeus, Booking.com,
 * Expedia, Kiwi.com, and others. Donated to Linux Foundation Dec 2025.
 *
 * This stub exposes Along's data as MCP-compatible resources and tools.
 * When travel suppliers (Resy, Amadeus, Booking.com) launch their MCP servers,
 * we swap in their MCP clients here instead of bespoke API calls.
 *
 * Spec: https://modelcontextprotocol.io/specification/2025-11-25
 *
 * TODO (future phase):
 * - Implement full MCP server using @modelcontextprotocol/sdk
 * - Expose resources: blueprints, locations, trip_intents, connections
 * - Expose tools: search_flights, get_itinerary, update_booking_status, watch_price
 * - Consume Kiwi.com MCP for flights, Booking.com MCP for hotels when available
 * - Auth: OAuth 2.1 PKCE per MCP spec
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// MCP server metadata
const SERVER_INFO = {
  name: 'along',
  version: '0.1.0',
  description: 'Along — AI travel concierge. Access trip blueprints, itineraries, and booking connections.',
  capabilities: {
    resources: { subscribe: false, listChanged: false },
    tools: {},
    prompts: {},
  },
}

// MCP resources exposed by Along
const MCP_RESOURCES = [
  {
    uri: 'along://blueprints',
    name: 'Trip blueprints',
    description: 'User\'s saved trip blueprints with locations and metadata',
    mimeType: 'application/json',
  },
  {
    uri: 'along://trip-intents',
    name: 'Trip intents',
    description: 'Active trip planning sessions with scope options and itinerary status',
    mimeType: 'application/json',
  },
  {
    uri: 'along://connections',
    name: 'Booking connections',
    description: 'Flight, hotel, restaurant, and calendar connections for trips',
    mimeType: 'application/json',
  },
]

// MCP tools exposed by Along
const MCP_TOOLS = [
  {
    name: 'get_itinerary',
    description: 'Retrieve the full day-by-day itinerary for a blueprint, including all places, timing, and booking requirements.',
    inputSchema: {
      type: 'object',
      properties: {
        blueprint_id: { type: 'string', description: 'UUID of the blueprint' },
      },
      required: ['blueprint_id'],
    },
  },
  {
    name: 'search_flights',
    description: 'Search for available flights between two cities for a given date. Returns real-time pricing from Duffel (300+ airlines).',
    inputSchema: {
      type: 'object',
      properties: {
        origin_iata: { type: 'string', description: 'Origin airport IATA code (e.g. JFK)' },
        destination_iata: { type: 'string', description: 'Destination airport IATA code (e.g. CDG)' },
        departure_date: { type: 'string', description: 'Departure date in YYYY-MM-DD format' },
        passengers: { type: 'number', description: 'Number of adult passengers', default: 1 },
      },
      required: ['origin_iata', 'destination_iata', 'departure_date'],
    },
  },
  {
    name: 'update_booking_status',
    description: 'Update the status of a booking connection (e.g., mark a flight as booked after user confirms).',
    inputSchema: {
      type: 'object',
      properties: {
        connection_id: { type: 'string', description: 'UUID of the connection to update' },
        status: {
          type: 'string',
          enum: ['suggested', 'searching', 'available', 'watching', 'calling', 'booked', 'unavailable'],
          description: 'New status for the connection',
        },
        provider_ref_id: { type: 'string', description: 'Provider-specific reference ID (booking ID, reservation number, etc.)' },
      },
      required: ['connection_id', 'status'],
    },
  },
  {
    name: 'watch_price',
    description: 'Set up a price watch on a flight segment. Along will monitor and notify when the price drops.',
    inputSchema: {
      type: 'object',
      properties: {
        connection_id: { type: 'string', description: 'UUID of the existing flight connection to watch' },
        target_price: { type: 'number', description: 'Optional target price to watch for (in USD)' },
      },
      required: ['connection_id'],
    },
  },
]

// Handle MCP initialize request
function handleInitialize() {
  return {
    protocolVersion: '2024-11-05',
    serverInfo: SERVER_INFO,
    capabilities: SERVER_INFO.capabilities,
  }
}

// Handle MCP resources/list
function handleListResources() {
  return { resources: MCP_RESOURCES }
}

// Handle MCP tools/list
function handleListTools() {
  return { tools: MCP_TOOLS }
}

// Handle MCP tools/call
async function handleToolCall(
  name: string,
  args: Record<string, unknown>,
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  switch (name) {
    case 'get_itinerary': {
      const { data: locations } = await supabase
        .from('locations')
        .select('*')
        .eq('blueprint_id', args.blueprint_id)
        .order('created_at')

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ blueprint_id: args.blueprint_id, locations }, null, 2),
        }],
      }
    }

    case 'search_flights': {
      // Delegate to the flights API route
      const res = await fetch('/api/connections/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint_id: null,  // MCP-initiated search, no blueprint context
          segments: [{
            origin_city: args.origin_iata,
            origin_iata: args.origin_iata,
            destination_city: args.destination_iata,
            destination_iata: args.destination_iata,
            date: args.departure_date,
            passengers: args.passengers ?? 1,
          }],
        }),
      })
      const data = await res.json()
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(data, null, 2),
        }],
      }
    }

    case 'update_booking_status': {
      const { error } = await supabase
        .from('connections')
        .update({
          status: args.status,
          ...(args.provider_ref_id ? { provider_ref_id: args.provider_ref_id } : {}),
        })
        .eq('id', args.connection_id)

      if (error) throw new Error(error.message)
      return { content: [{ type: 'text', text: 'Connection updated successfully' }] }
    }

    case 'watch_price': {
      const { error } = await supabase
        .from('connections')
        .update({
          status: 'watching',
          data: supabase.rpc ? {} : {},  // Merge target_price into data in production
        })
        .eq('id', args.connection_id)

      if (error) throw new Error(error.message)
      return { content: [{ type: 'text', text: 'Price watch activated' }] }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

// MCP uses HTTP POST with JSON-RPC 2.0 body
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: -32001, message: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      jsonrpc: string
      id: string | number
      method: string
      params?: Record<string, unknown>
    }

    const { id, method, params } = body

    let result: unknown

    switch (method) {
      case 'initialize':
        result = handleInitialize()
        break
      case 'resources/list':
        result = handleListResources()
        break
      case 'tools/list':
        result = handleListTools()
        break
      case 'tools/call': {
        const { name, arguments: toolArgs } = params as { name: string; arguments: Record<string, unknown> }
        result = await handleToolCall(name, toolArgs ?? {}, supabase)
        break
      }
      default:
        return NextResponse.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Method not found: ${method}` },
        })
    }

    return NextResponse.json({ jsonrpc: '2.0', id, result })
  } catch (err) {
    console.error('MCP error:', err)
    return NextResponse.json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32603, message: err instanceof Error ? err.message : 'Internal error' },
    }, { status: 500 })
  }
}

// MCP discovery endpoint (GET returns server info)
export async function GET() {
  return NextResponse.json({
    ...SERVER_INFO,
    mcp_endpoint: '/api/mcp',
    resources: MCP_RESOURCES,
    tools: MCP_TOOLS,
  })
}
