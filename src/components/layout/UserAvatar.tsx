'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function UserAvatar() {
  const { profile } = useAuth()

  if (!profile) return null

  const firstName = profile.name.split(' ')[0]

  return (
    <Link href="/profile" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-tight font-bold text-white flex-shrink-0"
        style={{ backgroundColor: 'var(--user-color)' }}
      >
        {firstName.charAt(0).toUpperCase()}
      </span>
      <span className="text-[10px] font-tight font-bold italic uppercase tracking-widest text-white/70">
        {firstName}
      </span>
    </Link>
  )
}
