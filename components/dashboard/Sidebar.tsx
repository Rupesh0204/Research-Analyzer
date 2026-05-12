'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>) },
  { href: '/documents', label: 'Documents', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>) },
  { href: '/history', label: 'History', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>) },
  { href: '/settings', label: 'Settings', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>) },
  { href: '/upgrade', label: 'Upgrade', isPro: true, icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>) },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const maxCredits = profile.plan === 'premium' ? 50 : 10
  const creditPct  = Math.max(0, Math.min(100, (profile.credits / maxCredits) * 100))
  const isLow      = creditPct <= 20

  async function signOut() {
    await supabase.auth.signOut()
    toast.success('Signed out successfully')
    router.push('/')
    router.refresh()
  }

  return (
    <aside style={{
      width: '240px', flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245,158,11,0.3)',
            flexShrink: 0,
          }}>
            <span style={{ color: '#000', fontWeight: 800, fontSize: 14 }}>R</span>
          </div>
          <div>
            <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>ResearchAI</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 11, fontFamily: 'monospace' }}>v1.0</div>
          </div>
        </Link>
      </div>

      {/* User card */}
      <div style={{ padding: '12px 12px 0' }}>
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name || profile.email.split('@')[0]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.email}
              </div>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: profile.plan === 'premium' ? 'var(--accent)' : 'var(--surface-3)',
              color: profile.plan === 'premium' ? '#000' : 'var(--text-muted)',
              flexShrink: 0, marginLeft: 8, fontFamily: 'monospace',
            }}>
              {profile.plan === 'premium' ? '★ PRO' : 'FREE'}
            </span>
          </div>
          {/* Credit bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 5 }}>
              <span style={{ color: 'var(--text-dim)' }}>Credits</span>
              <span style={{ color: isLow ? 'var(--red)' : 'var(--accent)', fontFamily: 'monospace', fontWeight: 600 }}>
                {profile.credits}/{maxCredits}
              </span>
            </div>
            <div style={{ height: 4, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${Math.max(3, creditPct)}%`,
                background: isLow ? 'var(--red)' : creditPct < 50 ? 'var(--accent)' : 'var(--green)',
                transition: 'width 0.6s ease',
              }} />
            </div>
            {isLow && profile.plan === 'free' && (
              <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 5 }}>
                Low credits —{' '}
                <Link href="/upgrade" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>upgrade</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 10,
                background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                transition: 'all 0.15s', fontSize: 14, fontWeight: active ? 600 : 400,
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLDivElement).style.color = 'var(--text)'; } }}
              onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; (e.currentTarget as HTMLDivElement).style.color = 'var(--text-muted)'; } }}
              >
                <span style={{ color: active ? 'var(--accent)' : 'inherit', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.isPro && profile.plan === 'free' && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: 'var(--accent)', color: '#000', padding: '1px 6px', borderRadius: 99, fontFamily: 'monospace' }}>PRO</span>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, color: 'var(--text-dim)', padding: '0 12px 8px', fontFamily: 'monospace' }}>
          {profile.total_queries} queries total
        </div>
        <button onClick={signOut} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 10, border: 'none', background: 'transparent',
          color: 'var(--text-dim)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-dim)'; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
