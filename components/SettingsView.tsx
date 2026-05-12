'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Profile { id: string; email: string; full_name: string | null; plan: string; credits: number; total_queries: number; created_at: string }
interface Tx { id: string; amount: number; status: string; plan_upgraded_to: string | null; credits_added: number; created_at: string }

export default function SettingsView({ profile, transactions }: { profile: Profile; transactions: Tx[] }) {
  const [name, setName] = useState(profile.full_name || '')
  const [newPw, setNewPw] = useState(''); const [confPw, setConfPw] = useState('')
  const [savingN, setSavingN] = useState(false); const [savingP, setSavingP] = useState(false); const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  async function saveName(e: React.FormEvent) {
    e.preventDefault(); setSavingN(true)
    const r = await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: name.trim() }) })
    setSavingN(false)
    if (r.ok) { toast.success('Name updated!'); router.refresh() } else toast.error((await r.json()).error)
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confPw) { toast.error('Passwords do not match'); return }
    if (newPw.length < 6) { toast.error('Minimum 6 characters'); return }
    setSavingP(true)
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setSavingP(false)
    if (error) toast.error(error.message); else { toast.success('Password changed!'); setNewPw(''); setConfPw('') }
  }

  async function deleteAccount() {
    if (!confirm('Permanently delete your account and ALL data? This cannot be undone.')) return
    setDeleting(true)
    const r = await fetch('/api/user/profile', { method: 'DELETE' })
    if (r.ok) { await supabase.auth.signOut(); router.push('/') } else { toast.error((await r.json()).error); setDeleting(false) }
  }

  const sec: React.CSSProperties = { background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }
  const secH: React.CSSProperties = { padding: '14px 20px', borderBottom: '1px solid #2e2e34', background: '#1e1e22', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9898a0' }
  const secB: React.CSSProperties = { padding: 20 }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, color: '#f1f1f3', fontSize: 13, fontFamily: 'inherit', outline: 'none' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9898a0', marginBottom: 6 }
  const btn: React.CSSProperties = { padding: '9px 20px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <div style={{ padding: 28, maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
      <p style={{ color: '#9898a0', fontSize: 13, marginBottom: 24 }}>Manage your account</p>

      {/* Overview */}
      <div style={sec}>
        <div style={secH}>Account Overview</div>
        <div style={secB}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { l: 'Plan', v: profile.plan === 'premium' ? '★ Premium' : 'Free', c: profile.plan === 'premium' ? '#f59e0b' : '#f1f1f3' },
              { l: 'Credits', v: profile.credits, c: '#f59e0b' },
              { l: 'Queries', v: profile.total_queries, c: '#f1f1f3' },
            ].map(s => (
              <div key={s.l} style={{ background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#606068', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px' }}>
            <span style={{ color: '#9898a0' }}>Email</span><span>{profile.email}</span>
            <span style={{ color: '#9898a0' }}>Member since</span><span>{new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Name */}
      <div style={sec}>
        <div style={secH}>Profile</div>
        <div style={secB}>
          <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>Display Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#2e2e34'} /></div>
            <div><label style={lbl}>Email</label><input value={profile.email} disabled style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} /></div>
            <button type="submit" disabled={savingN} style={{ ...btn, alignSelf: 'flex-start', opacity: savingN ? 0.5 : 1 }}>{savingN ? 'Saving…' : 'Save Name'}</button>
          </form>
        </div>
      </div>

      {/* Password */}
      <div style={sec}>
        <div style={secH}>Change Password</div>
        <div style={secB}>
          <form onSubmit={changePw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={lbl}>New Password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters" style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#2e2e34'} /></div>
            <div><label style={lbl}>Confirm Password</label><input type="password" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Repeat new password" style={inp} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = '#2e2e34'} /></div>
            <button type="submit" disabled={savingP || !newPw} style={{ ...btn, background: '#1e1e22', color: '#f1f1f3', border: '1px solid #2e2e34', alignSelf: 'flex-start', opacity: savingP || !newPw ? 0.5 : 1 }}>{savingP ? 'Changing…' : 'Change Password'}</button>
          </form>
        </div>
      </div>

      {/* Billing */}
      <div style={sec}>
        <div style={secH}>Billing History</div>
        <div style={secB}>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#606068', fontSize: 13 }}>No transactions yet</div>
          ) : transactions.map(tx => (
            <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #2e2e34' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{tx.plan_upgraded_to === 'premium' ? 'Premium Upgrade' : 'Transaction'}</div>
                <div style={{ fontSize: 11, color: '#606068', fontFamily: 'monospace', marginTop: 2 }}>
                  {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}{tx.credits_added > 0 ? ` · +${tx.credits_added} credits` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{(tx.amount / 100).toFixed(2)}</span>
                <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, fontFamily: 'monospace', background: tx.status === 'paid' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: tx.status === 'paid' ? '#22c55e' : '#f59e0b' }}>{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger */}
      <div style={{ ...sec, borderColor: 'rgba(239,68,68,0.25)' }}>
        <div style={{ ...secH, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>Danger Zone</div>
        <div style={secB}>
          <p style={{ fontSize: 13, color: '#9898a0', marginBottom: 14, lineHeight: 1.6 }}>Permanently delete your account and all data including documents, queries, and credits. Cannot be undone.</p>
          <button onClick={deleteAccount} disabled={deleting} style={{ padding: '9px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', opacity: deleting ? 0.5 : 1 }}>
            {deleting ? 'Deleting…' : 'Delete My Account'}
          </button>
        </div>
      </div>
    </div>
  )
}
