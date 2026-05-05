'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const { signIn, signUp, user, loading } = useAuth()
  const router = useRouter()

  const [mode,       setMode]       = useState<Mode>('signin')
  const [name,       setName]       = useState('')
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    if (mode === 'signin') {
      const { error: err } = await signIn(email.trim(), password)
      if (err) { setError(err); setSubmitting(false); return }
      router.replace('/dashboard')
    } else {
      if (!name.trim()) { setError('Name is required'); setSubmitting(false); return }
      const { error: err } = await signUp(email.trim(), password, name.trim())
      if (err) { setError(err); setSubmitting(false); return }
      setSuccess('Account created! Check your email to confirm, then sign in.')
      setSubmitting(false)
      setMode('signin')
    }
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

      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/tandem-logo.png"
          alt="Tandem"
          width={148}
          height={148}
          priority
        />
      </div>

      {/* Mode toggle */}
      <div className="w-full max-w-sm mb-4 grid grid-cols-2 border border-white/10 rounded-lg overflow-hidden">
        {(['signin', 'signup'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={[
              'py-2 text-xs font-tight font-bold italic uppercase tracking-tight transition-colors',
              mode === m
                ? 'bg-[var(--user-color)] text-[#1A1A1A]'
                : 'text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div className="card flex flex-col gap-4">

          {/* Name — sign-up only */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="section-label">Name</label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kerwin or Dani"
                className="input-field"
              />
            </div>
          )}

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
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
          {success && (
            <p className="text-sm text-[var(--user-color)] text-center">{success}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-center"
          >
            {submitting
              ? (mode === 'signin' ? 'SIGNING IN...' : 'CREATING ACCOUNT...')
              : (mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT')
            }
          </button>

        </div>
      </form>

    </main>
  )
}
