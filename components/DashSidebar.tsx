'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface Profile { id: string; email: string; full_name: string | null; plan: string; credits: number; total_queries: number }

export default function DashSidebar({ profile }: { profile: Profile }) {
  const path = usePathname()
  const router = useRouter()
  const maxCredits = profile.plan === 'premium' ? 50 : 10
  const pct = Math.round((profile.credits / maxCredits) * 100)

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
    router.refresh()
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', emoji: '🏠' },
    { href: '/documents', label: 'Documents', emoji: '📄' },
    { href: '/history', label: 'History', emoji: '🕐' },
    { href: '/settings', label: 'Settings', emoji: '⚙️' },
    { href: '/upgrade', label: 'Upgrade', emoji: '⭐' },
  ]

  return (
    <aside style={{ width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', background: '#131316', borderRight: '1px solid #2e2e34' }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #2e2e34' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#000', fontWeight: 800, fontSize: 14 }}>R</span>
          </div>
          <div>
            <div style={{ color: '#f1f1f3', fontWeight: 700, fontSize: 15 }}>ResearchAI</div>
            <div style={{ color: '#606068', fontSize: 11, fontFamily: 'monospace' }}>v1.0</div>
          </div>
        </Link>
      </div>

      {/* User info */}
      <div style={{ margin: '12px', padding: '12px', background: '#1a1a1d', borderRadius: 10, border: '1px solid #2e2e34' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#f1f1f3', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name || profile.email.split('@')[0]}
            </div>
            <div style={{ color: '#606068', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.email}
            </div>
          </div>
          <span style={{ flexShrink: 0, marginLeft: 8, fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 99, background: profile.plan === 'premium' ? '#f59e0b' : '#1e1e22', color: profile.plan === 'premium' ? '#000' : '#9898a0', border: profile.plan === 'free' ? '1px solid #2e2e34' : 'none' }}>
            {profile.plan === 'premium' ? '★ PRO' : 'FREE'}
          </span>
        </div>
        {/* Credit bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
            <span style={{ color: '#606068' }}>Credits</span>
            <span style={{ color: pct <= 20 ? '#ef4444' : '#f59e0b', fontFamily: 'monospace', fontWeight: 600 }}>{profile.credits}/{maxCredits}</span>
          </div>
          <div style={{ height: 4, background: '#2e2e34', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(3, pct)}%`, background: pct <= 20 ? '#ef4444' : '#f59e0b', borderRadius: 99, transition: 'width 0.5s ease' }} />
          </div>
          {pct <= 20 && profile.plan === 'free' && (
            <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>
              Low! <Link href="/upgrade" style={{ color: '#f59e0b', textDecoration: 'underline' }}>Upgrade →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, padding: '8px 10px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = path === item.href
          return (
            <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', marginBottom: 2, borderRadius: 8, background: active ? 'rgba(245,158,11,0.1)' : 'transparent', color: active ? '#f59e0b' : '#9898a0', fontWeight: active ? 600 : 400, fontSize: 14, border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent', transition: 'all 0.15s' }}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.emoji}</span>
              {item.label}
              {item.href === '/upgrade' && profile.plan === 'free' && (
                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '1px 5px', borderRadius: 99, fontFamily: 'monospace' }}>PRO</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid #2e2e34' }}>
        <div style={{ fontSize: 11, color: '#606068', padding: '0 12px 8px', fontFamily: 'monospace' }}>
          {profile.total_queries} total queries
        </div>
        <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: '#606068', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
