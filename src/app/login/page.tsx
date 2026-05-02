'use client'

import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const CODE_LENGTH = 8

export default function LoginPage() {
  const { sendLoginCode, verifyLoginCode, user, loading } = useAuth()
  const router = useRouter()

  const [step, setStep]           = useState<'email' | 'code'>('email')
  const [email, setEmail]         = useState('')
  const [digits, setDigits]       = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [error, setError]         = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  useEffect(() => {
    if (step === 'code') inputRefs.current[0]?.focus()
  }, [step])

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)
    const { error: sendError } = await sendLoginCode(email.trim())
    setSubmitting(false)
    if (sendError) { setError(sendError); return }
    setStep('code')
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const token = digits.join('')
    if (token.length < CODE_LENGTH) { setError('Please enter all 8 digits.'); return }
    setError(null)
    setSubmitting(true)
    const { error: verifyError } = await verifyLoginCode(email.trim(), token)
    setSubmitting(false)
    if (verifyError) { setError(verifyError); return }
    router.replace('/dashboard')
  }

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = [...digits]
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i]
    setDigits(next)
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
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
      <div className="mb-10 text-center">
        <h1 className="tandem-heading text-5xl">Tandem</h1>
        <p className="mt-2 text-sm text-white/40">Train together. Win together.</p>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleSendCode} className="w-full max-w-sm flex flex-col gap-4">
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

            {error && (
              <p className="text-sm text-red-400 text-center animate-fade-up">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-center"
            >
              {submitting ? 'SENDING...' : 'SEND LOGIN CODE'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="w-full max-w-sm flex flex-col gap-4">
          <div className="card flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <p className="section-label text-center">Enter the 8-digit code sent to</p>
              <p className="text-sm text-white/60 text-center truncate">{email}</p>
            </div>

            <div className="flex justify-center gap-2">
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  onPaste={handlePaste}
                  className="w-9 h-12 text-center text-lg font-mono input-field px-0"
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center animate-fade-up">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full text-center"
            >
              {submitting ? 'VERIFYING...' : 'SIGN IN'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setDigits(Array(CODE_LENGTH).fill('')); setError(null) }}
              className="text-sm text-white/40 hover:text-white/70 text-center transition-colors"
            >
              Use a different email
            </button>
          </div>
        </form>
      )}
    </main>
  )
}
