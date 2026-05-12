'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Query { id: string; query: string; result: any; status: string; error_message: string | null; model_used: string | null; processing_time_ms: number | null; created_at: string; documents: any }

export default function HistoryView({ queries }: { queries: Query[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'completed' | 'error'>('all')

  const filtered = queries.filter(q => filter === 'all' || q.status === filter)
  const done = queries.filter(q => q.status === 'completed')
  const avgConf = done.length > 0 ? Math.round(done.reduce((s, q) => s + (q.result?.confidence_score || 0), 0) / done.length * 100) : 0

  function dlExport(id: string, fmt: 'json' | 'txt') {
    window.open(`/api/queries/export?id=${id}&format=${fmt}`, '_blank')
    toast.success(`Downloading .${fmt}`)
  }

  const card: React.CSSProperties = { background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }
  const secLbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#606068', marginBottom: 8 }

  return (
    <div style={{ padding: 28, maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Query History</h1>
      <p style={{ color: '#9898a0', fontSize: 13, marginBottom: 20 }}>
        {queries.length} total · {done.length} completed{avgConf > 0 ? ` · ${avgConf}% avg confidence` : ''}
      </p>

      {/* Stats */}
      {queries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { l: 'Total', v: queries.length, c: '#f1f1f3' },
            { l: 'Completed', v: done.length, c: '#22c55e' },
            { l: 'Failed', v: queries.filter(q => q.status === 'error').length, c: '#ef4444' },
            { l: 'Avg Confidence', v: avgConf > 0 ? `${avgConf}%` : '—', c: avgConf >= 75 ? '#22c55e' : '#f59e0b' },
          ].map(s => (
            <div key={s.l} style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#606068', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['all', 'completed', 'error'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: filter === f ? 600 : 400, background: filter === f ? 'rgba(245,158,11,0.1)' : 'transparent', color: filter === f ? '#f59e0b' : '#9898a0', borderColor: filter === f ? 'rgba(245,158,11,0.3)' : '#2e2e34', transition: 'all 0.15s' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}{f !== 'all' ? ` (${queries.filter(q => q.status === f).length})` : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#606068' }}>
          <div style={{ fontSize: 44, opacity: 0.3, marginBottom: 10 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>No queries found</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>{filter !== 'all' ? 'Try a different filter' : 'Upload a document and run your first query'}</div>
        </div>
      ) : filtered.map(q => (
        <div key={q.id} style={card}>
          <div onClick={() => setExpanded(expanded === q.id ? null : q.id)}
            style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 5, background: q.status === 'completed' ? '#22c55e' : q.status === 'error' ? '#ef4444' : '#f59e0b' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{q.query}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11, color: '#606068', fontFamily: 'monospace' }}>
                {q.documents?.title && <span>📄 {q.documents.title}</span>}
                <span>{new Date(q.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                {q.model_used && <span style={{ background: '#1e1e22', padding: '1px 5px', borderRadius: 4 }}>{q.model_used.replace('gemini-1.5-', '')}</span>}
                {q.processing_time_ms && <span>{(q.processing_time_ms / 1000).toFixed(1)}s</span>}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {q.result?.confidence_score != null && (
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: q.result.confidence_score >= 0.8 ? '#22c55e' : q.result.confidence_score >= 0.6 ? '#f59e0b' : '#ef4444' }}>
                  {Math.round(q.result.confidence_score * 100)}%
                </span>
              )}
              {q.result && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['txt', 'json'] as const).map(f => (
                    <button key={f} onClick={e => { e.stopPropagation(); dlExport(q.id, f) }}
                      style={{ fontSize: 11, padding: '3px 7px', border: '1px solid #2e2e34', borderRadius: 5, background: 'transparent', color: '#9898a0', cursor: 'pointer', fontFamily: 'monospace' }}>.{f.toUpperCase()}</button>
                  ))}
                </div>
              )}
              <span style={{ fontSize: 11, color: '#606068' }}>{expanded === q.id ? '▲' : '▼'}</span>
            </div>
          </div>

          {expanded === q.id && (
            <div style={{ borderTop: '1px solid #2e2e34', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {q.result ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div style={secLbl}>Topic</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#f59e0b' }}>{q.result.topic}</div>
                    </div>
                    <div>
                      <div style={secLbl}>Confidence</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#2e2e34', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: Math.round(q.result.confidence_score * 100) + '%', background: q.result.confidence_score >= 0.8 ? '#22c55e' : q.result.confidence_score >= 0.6 ? '#f59e0b' : '#ef4444', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#f59e0b' }}>{Math.round(q.result.confidence_score * 100)}%</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div style={secLbl}>Summary</div>
                    <div style={{ background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, padding: '12px 14px', fontSize: 13, lineHeight: 1.7 }}>{q.result.summary}</div>
                  </div>
                  {q.result.key_points?.length > 0 && (
                    <div>
                      <div style={secLbl}>Key Points</div>
                      {q.result.key_points.map((pt: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, padding: '6px 0' }}>
                          <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>→</span>{pt}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.result.insights?.length > 0 && (
                    <div>
                      <div style={secLbl}>Insights</div>
                      {q.result.insights.map((ins: string, i: number) => (
                        <div key={i} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 13, marginBottom: 6 }}>💡 {ins}</div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
                  Error: {q.error_message || 'Unknown error'}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
