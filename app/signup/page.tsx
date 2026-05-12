'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name.trim() } },
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      toast.success('Account created! Welcome 🎉')
      router.push('/dashboard')
      router.refresh()
    }
  }

  const inp = { width: '100%', padding: '11px 14px', background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: '8px', color: '#f1f1f3', fontSize: '14px', fontFamily: 'inherit', outline: 'none' }
  const lbl = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#9898a0', marginBottom: '6px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }

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
          <h1 style={{ color: '#f1f1f3', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: '#9898a0', fontSize: 14 }}>Start with 10 free research credits</p>
        </div>

        <form onSubmit={handleSignup} style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            { label: 'Full Name', type: 'text', val: name, set: setName, ph: 'Your name' },
            { label: 'Email', type: 'email', val: email, set: setEmail, ph: 'you@example.com' },
            { label: 'Password', type: 'password', val: password, set: setPassword, ph: 'Min 6 characters' },
          ].map(f => (
            <div key={f.label}>
              <label style={lbl}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} required placeholder={f.ph} style={inp}
                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                onBlur={e => e.target.style.borderColor = '#2e2e34'} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            style={{ padding: '12px', background: loading ? '#9898a0' : '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4 }}>
            {loading ? 'Creating account…' : 'Create Account — Free →'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#606068' }}>10 credits · No credit card required</p>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#606068', marginTop: 20 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#f59e0b', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
