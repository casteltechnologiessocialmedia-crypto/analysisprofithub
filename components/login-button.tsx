'use client'

import { useState } from 'react'
import { LogIn, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoginButtonProps {
  onLogin: () => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function LoginButton({
  onLogin,
  isLoading = false,
  disabled = false,
  className,
  variant = 'primary',
  size = 'md'
}: LoginButtonProps) {
  const [localLoading, setLocalLoading] = useState(false)
  const loading = isLoading || localLoading

  const handleClick = async () => {
    setLocalLoading(true)
    try {
      await onLogin()
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setLocalLoading(false)
    }
  }

  const variants = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white',
    outline: 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3.5 text-lg'
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </>
      )}
    </button>
  )
}
