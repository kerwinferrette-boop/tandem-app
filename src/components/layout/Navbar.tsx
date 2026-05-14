'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: '/train',
    label: 'Train',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="10" width="4" height="4" rx="1" />
        <rect x="18" y="10" width="4" height="4" rx="1" />
        <rect x="6" y="8" width="2" height="8" rx="0.5" />
        <rect x="16" y="8" width="2" height="8" rx="0.5" />
        <rect x="8" y="11" width="8" height="2" rx="0.5" />
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Stats',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6"  y1="20" x2="6"  y2="14" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Me',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const { profile, loading } = useAuth()
  const pathname = usePathname()

  if (loading || !profile) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06]" style={{ backgroundColor: '#161A24' }}>
      <div className="max-w-lg mx-auto h-16 grid grid-cols-4 items-center">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center justify-center gap-1 h-full transition-colors"
              style={active ? { color: 'var(--user-color)' } : { color: 'rgba(255,255,255,0.30)' }}
            >
              {icon}
              <span className="text-[9px] font-tight font-bold italic uppercase tracking-widest">
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
