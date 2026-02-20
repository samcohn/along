'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Along</h1>
          <p className="mt-2 text-sm text-white/50">Sign in to your account</p>
        </div>

        {sent ? (
          <p className="text-sm text-white/70">
            Check your email — we sent a magic link to <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black rounded-lg px-4 py-3 text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition"
            >
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs text-white/30">
            <span className="bg-black px-2">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          className="w-full border border-white/20 rounded-lg px-4 py-3 text-sm hover:bg-white/5 transition"
        >
          Continue with Google
        </button>
      </div>
    </main>
  )
}
