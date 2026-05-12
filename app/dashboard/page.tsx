import DashLayout from '@/components/DashLayout'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: docs }, { data: queries }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('documents').select('id,title,status,file_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('research_queries').select('id,query,status,result,model_used,processing_time_ms').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
  ])

  if (!profile) redirect('/login')

  const maxDocs = profile.plan === 'premium' ? 3 : 1
  const maxCred = profile.plan === 'premium' ? 50 : 10
  const credPct = Math.round((profile.credits / maxCred) * 100)
  const readyDocs = (docs || []).filter((d: any) => d.status === 'ready').length
  const doneQ = (queries || []).filter((q: any) => q.status === 'completed')
  const avgConf = doneQ.length > 0
    ? Math.round(doneQ.reduce((s: number, q: any) => s + (q.result?.confidence_score || 0), 0) / doneQ.length * 100)
    : 0

  const card: React.CSSProperties = { background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 12, padding: 20 }

  return (
    <DashLayout>
      <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
          Welcome back, <span style={{ color: '#f59e0b' }}>{profile.full_name?.split(' ')[0] || profile.email.split('@')[0]}</span> 👋
        </h1>
        <p style={{ color: '#9898a0', fontSize: 14, marginBottom: 28 }}>Your AI research workspace</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Credits Left', value: profile.credits, sub: `${credPct}% of ${maxCred}`, color: credPct <= 20 ? '#ef4444' : '#f59e0b' },
            { label: 'Documents', value: `${readyDocs}/${maxDocs}`, sub: 'indexed', color: '#f1f1f3' },
            { label: 'Total Queries', value: profile.total_queries, sub: 'all time', color: '#f1f1f3' },
            { label: 'Avg Confidence', value: avgConf > 0 ? `${avgConf}%` : '—', sub: avgConf > 0 ? 'across queries' : 'run a query', color: avgConf >= 75 ? '#22c55e' : avgConf > 0 ? '#f59e0b' : '#606068' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 11, color: '#606068', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 30, fontWeight: 700, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#606068' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Credit Usage</span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#9898a0', fontFamily: 'monospace' }}>{profile.credits}/{maxCred} remaining</span>
              {profile.plan === 'free' && <Link href="/upgrade" style={{ fontSize: 12, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '4px 12px', borderRadius: 99 }}>Upgrade →</Link>}
            </div>
          </div>
          <div style={{ height: 8, background: '#2e2e34', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(2, credPct)}%`, background: credPct <= 20 ? '#ef4444' : credPct <= 50 ? '#f59e0b' : '#22c55e', borderRadius: 99 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2e34', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9898a0' }}>Recent Queries</span>
              <Link href="/history" style={{ fontSize: 12, color: '#f59e0b' }}>View all →</Link>
            </div>
            {!queries || queries.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#606068' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>No queries yet</div>
                <Link href="/documents" style={{ fontSize: 13, fontWeight: 700, background: '#f59e0b', color: '#000', padding: '8px 18px', borderRadius: 8 }}>Upload Document →</Link>
              </div>
            ) : (queries as any[]).map((q: any) => (
              <div key={q.id} style={{ padding: '12px 20px', borderBottom: '1px solid #2e2e34', display: 'flex', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: q.status === 'completed' ? '#22c55e' : q.status === 'error' ? '#ef4444' : '#f59e0b' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{q.query}</div>
                  <div style={{ fontSize: 11, color: '#606068', fontFamily: 'monospace', display: 'flex', gap: 8 }}>
                    {q.model_used && <span style={{ background: '#1e1e22', padding: '1px 5px', borderRadius: 4 }}>{q.model_used.replace('gemini-1.5-', '')}</span>}
                    {q.result?.confidence_score != null && <span style={{ color: '#f59e0b' }}>{Math.round(q.result.confidence_score * 100)}% conf</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2e34' }}>
                <span style={{ fontWeight: 600, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9898a0' }}>Quick Actions</span>
              </div>
              <div style={{ padding: 12 }}>
                {[
                  { href: '/documents', emoji: '📄', label: 'Upload Document', sub: `${maxDocs - readyDocs} slot${maxDocs - readyDocs !== 1 ? 's' : ''} free`, disabled: readyDocs >= maxDocs },
                  { href: '/documents', emoji: '🧠', label: 'Research Query', sub: `${profile.credits} credits left`, disabled: profile.credits <= 0 },
                  { href: '/history', emoji: '📋', label: 'View History', sub: `${profile.total_queries} total`, disabled: false },
                ].map(a => (
                  <Link key={a.label} href={a.disabled ? '/upgrade' : a.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 6, background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, opacity: a.disabled ? 0.5 : 1 }}>
                    <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{a.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{a.label}</div>
                      <div style={{ fontSize: 11, color: '#606068' }}>{a.sub}</div>
                    </div>
                    <span style={{ color: '#f59e0b' }}>→</span>
                  </Link>
                ))}
              </div>
            </div>
            <div style={{ ...card, background: profile.plan === 'premium' ? 'rgba(245,158,11,0.06)' : '#1a1a1d', borderColor: profile.plan === 'premium' ? 'rgba(245,158,11,0.3)' : '#2e2e34' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{profile.plan === 'premium' ? '★ Premium' : 'Free Plan'}</span>
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 99, background: profile.plan === 'premium' ? '#f59e0b' : '#1e1e22', color: profile.plan === 'premium' ? '#000' : '#9898a0', border: profile.plan === 'free' ? '1px solid #2e2e34' : 'none' }}>
                  {profile.plan.toUpperCase()}
                </span>
              </div>
              {(profile.plan === 'premium' ? ['50 credits','3 documents','Gemini Pro','Export reports'] : ['10 credits','1 document','Gemini Flash','Basic reports']).map(f => (
                <div key={f} style={{ fontSize: 13, color: '#9898a0', padding: '3px 0', display: 'flex', gap: 8 }}><span style={{ color: '#f59e0b' }}>✓</span>{f}</div>
              ))}
              {profile.plan === 'free' && <Link href="/upgrade" style={{ display: 'block', textAlign: 'center', padding: '9px', background: '#f59e0b', color: '#000', borderRadius: 8, fontWeight: 700, fontSize: 13, marginTop: 14 }}>Upgrade to Premium →</Link>}
            </div>
          </div>
        </div>
      </div>
    </DashLayout>
  )
}
