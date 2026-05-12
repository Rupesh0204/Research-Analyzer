'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setLoading(false)
    if (error) toast.error(error.message)
    else { setSent(true); toast.success('Reset link sent!') }
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
          <h1 style={{ color: '#f1f1f3', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Reset password</h1>
          <p style={{ color: '#9898a0', fontSize: 14 }}>Enter your email to receive a reset link</p>
        </div>
        {sent ? (
          <div style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 14, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📧</div>
            <h2 style={{ color: '#f1f1f3', fontWeight: 700, marginBottom: 8 }}>Check your inbox</h2>
            <p style={{ color: '#9898a0', fontSize: 14, marginBottom: 16 }}>We sent a reset link to <strong>{email}</strong></p>
            <Link href="/login" style={{ color: '#f59e0b', fontWeight: 600 }}>Back to login →</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9898a0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = '#2e2e34'} />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '12px', background: loading ? '#9898a0' : '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? 'Sending…' : 'Send Reset Link →'}
            </button>
            <Link href="/login" style={{ textAlign: 'center', fontSize: 13, color: '#606068' }}>← Back to login</Link>
          </form>
        )}
      </div>
    </div>
  )
}
