import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'The Pivot — Your Personal Interview Wingman',
  description:
    'Upload your resume, paste the job description, and get AI-powered gap analysis, practice questions, and a custom cheat sheet — in minutes.',
  generator: 'v0.app',
  metadataBase: new URL('https://thepivot.app'),
  openGraph: {
    title: 'The Pivot — Your Personal Interview Wingman',
    description: 'Land the role. In 3 days.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Pivot — Your Personal Interview Wingman',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)',  color: '#0A0A0F'  },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
