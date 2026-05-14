import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight } from 'next/font/google'
import localFont from 'next/font/local'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { RestTimerProvider } from '@/contexts/RestTimerContext'
import Navbar from '@/components/layout/Navbar'
import RestTimerChip from '@/components/layout/RestTimerChip'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tandem',
  description: 'Train together. Win together.',
  icons: { icon: '/favicon.ico' },
}

export const viewport: Viewport = {
  themeColor: '#111318',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // 'dark' class hard-locks Tailwind dark mode — OS preference is ignored
    <html lang="en" className={`dark ${inter.variable} ${interTight.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <RestTimerProvider>
          <AuthProvider>
            <ThemeProvider>
              <div className="pb-16">
                {children}
              </div>
              <RestTimerChip />
              <Navbar />
            </ThemeProvider>
          </AuthProvider>
        </RestTimerProvider>
      </body>
    </html>
  )
}
