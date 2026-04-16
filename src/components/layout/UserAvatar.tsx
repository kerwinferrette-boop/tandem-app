'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function UserAvatar() {
  const { profile } = useAuth()

  if (!profile) return null

  const firstName = profile.name.split(' ')[0]

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: profile.theme_color }}
      />
      <span className="text-[10px] font-tight font-bold italic uppercase tracking-widest text-white/70">
        {firstName}
      </span>
    </div>
  )
}
