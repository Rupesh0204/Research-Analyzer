'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Welcome back!')
      router.push('/dashboard')
      router.refresh()
    }
  }

  const inp = { width: '100%', padding: '11px 14px', background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: '8px', color: '#f1f1f3', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f11', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: '#f59e0b', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#000', fontWeight: 800 }}>R</span>
            </div>
            <span style={{ color: '#f1f1f3', fontWeight: 700, fontSize: 18 }}>ResearchAI</span>
          </Link>
          <h1 style={{ color: '#f1f1f3', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: '#9898a0', fontSize: 14 }}>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = '#2e2e34'} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inp}
              onFocus={e => e.target.style.borderColor = '#f59e0b'}
              onBlur={e => e.target.style.borderColor = '#2e2e34'} />
          </div>
          <button type="submit" disabled={loading}
            style={{ padding: '12px', background: loading ? '#9898a0' : '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: '#606068' }}>
            <Link href="/reset-password" style={{ color: '#9898a0' }}>Forgot password?</Link>
          </p>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#606068', marginTop: 20 }}>
          No account?{' '}
          <Link href="/signup" style={{ color: '#f59e0b', fontWeight: 600 }}>Create one free →</Link>
        </p>
      </div>
    </div>
  )
}
