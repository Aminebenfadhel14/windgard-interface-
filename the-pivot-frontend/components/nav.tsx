'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sun, Moon, LayoutDashboard, LogOut, User } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const STEPS = [
  { label: 'Upload', pattern: /^\/$/ },
  { label: 'Gap Radar', pattern: /^\/session\/[^/]+$/ },
  { label: 'Practice', pattern: /^\/session\/[^/]+\/practice/ },
  { label: 'Feedback', pattern: /^\/session\/[^/]+\/practice/ },
  { label: 'Cheat Sheet', pattern: /^\/session\/[^/]+\/cheat-sheet/ },
]

function getStep(pathname: string): number {
  if (/^\/session\/[^/]+\/cheat-sheet/.test(pathname)) return 5
  if (/^\/session\/[^/]+\/practice/.test(pathname)) return 3
  if (/^\/session\/[^/]+$/.test(pathname)) return 2
  if (/^\/$/.test(pathname)) return 1
  return 0
}

export function Nav({ showProgress = false }: { showProgress?: boolean }) {
  const pathname = usePathname()
  const { toggle } = useTheme()
  const { user, signOut } = useAuth()
  const step = getStep(pathname)

  const isDark = typeof window !== 'undefined'
    ? document.documentElement.classList.contains('dark')
    : true

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      {/* Top progress bar */}
      {showProgress && step > 0 && (
        <div className="h-0.5 bg-border w-full overflow-hidden">
          <motion.div
            className="h-full score-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pivot-purple to-pivot-purple-soft flex items-center justify-center">
            <span className="text-white font-bold text-xs">P</span>
          </div>
          <span className="font-bold text-sm tracking-tight text-foreground hidden sm:block">
            The Pivot
          </span>
        </Link>

        {/* Step indicator (session pages) */}
        {showProgress && step > 0 && (
          <div className="hidden md:flex items-center gap-1 text-xs">
            {STEPS.slice(0, 5).map((s, i) => {
              const n = i + 1
              const active = n === step
              const done = n < step
              return (
                <span key={s.label} className="flex items-center gap-1">
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                      done && 'bg-pivot-teal text-white',
                      active && 'bg-primary text-primary-foreground',
                      !done && !active && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {n}
                  </span>
                  <span className={cn('text-[10px]', active ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                    {s.label}
                  </span>
                  {i < 4 && <span className="text-border mx-1">›</span>}
                </span>
              )
            })}
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto">
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Sun className="w-4 h-4 hidden dark:block" />
            <Moon className="w-4 h-4 block dark:hidden" />
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pivot-purple to-pivot-purple-soft flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
