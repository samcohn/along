'use client'

import Link from 'next/link'

/**
 * Minimal top-left nav for the map view.
 * "Along" logotype → back to dashboard.
 * "Plan a trip" → intake flow.
 */
export default function MapNav() {
  return (
    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
      {/* Logo → dashboard */}
      <Link
        href="/app"
        className="pointer-events-auto flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 hover:border-white/25 rounded-xl px-3 py-2 transition-all group"
      >
        <span className="text-white/70 text-sm font-semibold tracking-tight group-hover:text-white transition">Along</span>
        <svg className="w-3 h-3 text-white/20 group-hover:text-white/40 transition" viewBox="0 0 12 12" fill="none">
          <path d="M8 2H2v8h8V6M6 2h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </Link>

      {/* Plan a trip CTA */}
      <Link
        href="/app/new"
        className="pointer-events-auto flex items-center gap-1.5 bg-black/50 backdrop-blur-xl border border-white/[0.08] hover:border-white/20 rounded-xl px-3 py-2 transition-all group"
      >
        <span className="text-white/40 text-xs group-hover:text-white/70 transition">+ Plan a trip</span>
      </Link>
    </div>
  )
}
