'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import UserAvatar from './UserAvatar'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Train',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    href: '/competition',
    label: 'Compete',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h16l-2 8a6 6 0 01-12 0L4 2z" />
        <path d="M8 18h8M12 10v8" />
        <path d="M2 4h2M22 4h-2" />
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3,17 9,11 13,15 21,7" />
        <polyline points="15,7 21,7 21,13" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const { profile } = useAuth()
  const pathname = usePathname()

  if (!profile) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#1A1A1A]">
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: user identity */}
        <UserAvatar />

        {/* Right: nav links */}
        <div className="flex gap-6">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 transition-colors"
                style={active ? { color: 'var(--user-color)' } : undefined}
              >
                <span className={active ? '' : 'text-white/30'}>
                  {icon}
                </span>
                <span
                  className={`text-[9px] font-tight font-bold italic uppercase tracking-widest ${
                    active ? '' : 'text-white/30'
                  }`}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
