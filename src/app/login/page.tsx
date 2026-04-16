'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { signIn, user, loading } = useAuth()
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Already logged in — go to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return

    setError(null)
    setSubmitting(true)

    const { error: signInError } = await signIn(email.trim(), password)

    if (signInError) {
      setError(signInError)
      setSubmitting(false)
      return
    }

    router.replace('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4">
      {/* Logo / wordmark */}
      <div className="mb-10 text-center">
        <h1 className="tandem-heading text-5xl">Tandem</h1>
        <p className="mt-2 text-sm text-white/40">Train together. Win together.</p>
      </div>

      {/* Login card */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4"
      >
        <div className="card flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="section-label">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="section-label">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center animate-fade-up">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-center"
          >
            {submitting ? 'SIGNING IN...' : 'SIGN IN'}
          </button>
        </div>
      </form>
    </main>
  )
}
