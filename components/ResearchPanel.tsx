'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'

interface Doc { id: string; title: string; chunk_count: number; status: string }
interface Profile { plan: string; credits: number }
interface Result { topic: string; summary: string; key_points: string[]; insights: string[]; citations: any[]; confidence_score: number; methodology?: string; limitations?: string }

function ConfBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'
  const label = pct >= 80 ? 'High' : pct >= 60 ? 'Medium' : 'Low'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: '#2e2e34', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace', minWidth: 36 }}>{pct}%</span>
      <span style={{ fontSize: 11, color: '#606068' }}>{label}</span>
    </div>
  )
}

function ResultView({ result, qId, ms, model }: { result: Result; qId: string; ms?: number; model?: string }) {
  async function copy() {
    const t = [`Topic: ${result.topic}`, '', `Summary:\n${result.summary}`, '', `Key Points:\n${result.key_points.map((p, i) => `${i + 1}. ${p}`).join('\n')}`, '', `Insights:\n${result.insights.map(i => `• ${i}`).join('\n')}`, '', `Confidence: ${Math.round(result.confidence_score * 100)}%`].join('\n')
    await navigator.clipboard.writeText(t)
    toast.success('Copied!')
  }

  const box: React.CSSProperties = { background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, padding: '12px 14px' }
  const secLbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#606068', marginBottom: 8 }
  const tagStyle: React.CSSProperties = { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontFamily: 'monospace', background: '#1e1e22', border: '1px solid #2e2e34', color: '#9898a0' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Meta + export */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {model && <span style={tagStyle}>{model.replace('gemini-1.5-', 'gemini-')}</span>}
          {ms && <span style={tagStyle}>{(ms / 1000).toFixed(1)}s</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={copy} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #2e2e34', borderRadius: 6, background: 'transparent', color: '#9898a0', cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
          {(['txt', 'json'] as const).map(f => (
            <button key={f} onClick={() => { window.open(`/api/queries/export?id=${qId}&format=${f}`, '_blank'); toast.success(`.${f} downloading`) }}
              style={{ fontSize: 12, padding: '5px 12px', border: '1px solid #2e2e34', borderRadius: 6, background: 'transparent', color: '#9898a0', cursor: 'pointer', fontFamily: 'inherit' }}>.{f.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <ConfBar score={result.confidence_score} />

      <div>
        <div style={secLbl}>Topic</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#f59e0b', lineHeight: 1.3 }}>{result.topic}</div>
      </div>

      <div>
        <div style={secLbl}>Summary</div>
        <div style={{ ...box, fontSize: 13, lineHeight: 1.75 }}>{result.summary}</div>
      </div>

      {result.key_points?.length > 0 && (
        <div>
          <div style={secLbl}>Key Points ({result.key_points.length})</div>
          {result.key_points.map((pt, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 12px', background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>{pt}</span>
            </div>
          ))}
        </div>
      )}

      {result.insights?.length > 0 && (
        <div>
          <div style={secLbl}>Insights</div>
          {result.insights.map((ins, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 13, marginBottom: 6 }}>
              💡 {ins}
            </div>
          ))}
        </div>
      )}

      {result.citations?.length > 0 && (
        <div>
          <div style={secLbl}>Citations ({result.citations.length})</div>
          {result.citations.map((c: any, i: number) => (
            <div key={i} style={{ ...box, fontSize: 12, marginBottom: 6 }}>
              <div style={{ fontFamily: 'monospace', color: '#606068', marginBottom: 4 }}>
                [{i + 1}] {c.source}
                {c.relevance_score != null && <span style={{ color: '#f59e0b', marginLeft: 8 }}>{Math.round(Number(c.relevance_score) * 100)}% match</span>}
              </div>
              <div style={{ fontStyle: 'italic', color: '#9898a0' }}>"{c.text}"</div>
            </div>
          ))}
        </div>
      )}

      {result.limitations && (
        <div style={{ ...box, fontSize: 12, color: '#9898a0', borderColor: '#3e3e45' }}>
          <strong>⚠ Limitations: </strong>{result.limitations}
        </div>
      )}
    </div>
  )
}

export default function ResearchPanel({ doc, profile }: { doc: Doc; profile: Profile }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [qId, setQId] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ ms?: number; model?: string; credits?: number; chunks?: number }>({})
  const [err, setErr] = useState<string | null>(null)
  const canQ = profile.credits > 0 && doc.status === 'ready'
  const tooShort = query.trim().length < 10

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (tooShort || !canQ) return
    setLoading(true); setResult(null); setErr(null); setQId(null)
    const tid = toast.loading('Running RAG pipeline…')
    try {
      const res = await fetch('/api/queries/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: query.trim(), document_id: doc.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.result); setQId(data.query_id)
      setMeta({ ms: data.processing_time_ms, model: data.model_used, credits: data.credits_remaining, chunks: data.chunks_analyzed })
      toast.success(`Done! ${data.credits_remaining} credits · ${data.chunks_analyzed} chunks`, { id: tid, duration: 4000 })
    } catch (e: any) { setErr(e.message); toast.error(e.message, { id: tid }) }
    finally { setLoading(false) }
  }

  const wrap: React.CSSProperties = { background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 12, display: 'flex', flexDirection: 'column', minHeight: 520, overflow: 'hidden' }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', background: '#1e1e22', border: '1px solid #2e2e34', borderRadius: 8, color: '#f1f1f3', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.6 }

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #2e2e34', background: '#1e1e22' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ color: '#f59e0b', fontSize: 14 }}>📄</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{doc.title}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', padding: '2px 8px', borderRadius: 99, background: doc.status === 'ready' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: doc.status === 'ready' ? '#22c55e' : '#f59e0b' }}>
            ● {doc.status}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#606068', fontFamily: 'monospace' }}>
          {doc.chunk_count} chunks indexed · {profile.credits} credits left
          {meta.credits != null && meta.credits !== profile.credits && <span style={{ color: '#f59e0b', marginLeft: 8 }}>→ now {meta.credits}</span>}
        </div>
      </div>

      <div style={{ flex: 1, padding: 18, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
        {/* Query form */}
        <form onSubmit={submit} style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#606068', marginBottom: 6 }}>Research Query</label>
          <textarea value={query} onChange={e => setQuery(e.target.value)} rows={3} disabled={loading || !canQ}
            placeholder={!canQ ? (profile.credits <= 0 ? 'No credits left — upgrade to continue' : 'Document not ready…') : 'What are the main findings? Summarize the methodology… What conclusions does the paper draw about…'}
            style={{ ...inp, borderColor: query.length > 0 && tooShort ? '#ef4444' : '#2e2e34', opacity: (!canQ || loading) ? 0.5 : 1 }}
            onFocus={e => { if (canQ) e.target.style.borderColor = '#f59e0b' }}
            onBlur={e => { e.target.style.borderColor = query.length > 0 && tooShort ? '#ef4444' : '#2e2e34' }} />
          <div style={{ fontSize: 11, fontFamily: 'monospace', textAlign: 'right', marginTop: 3, color: tooShort && query.length > 0 ? '#ef4444' : '#606068' }}>
            {query.trim().length}/10 min chars
          </div>
          <button type="submit" disabled={loading || !canQ || tooShort}
            style={{ width: '100%', padding: '11px', background: loading || !canQ || tooShort ? '#2e2e34' : '#f59e0b', color: loading || !canQ || tooShort ? '#606068' : '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading || !canQ || tooShort ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8, transition: 'all 0.15s' }}>
            {loading ? '⟳ Analyzing…' : canQ ? `Generate Report — 1 Credit (${profile.credits} left)` : 'No credits — Upgrade to Premium'}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:.8}}`}</style>
            {[100, 75, 55, 85, 60].map((w, i) => (
              <div key={i} style={{ height: i === 1 ? 52 : 14, width: w + '%', background: '#1e1e22', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite', animationDelay: i * 0.08 + 's' }} />
            ))}
            <div style={{ fontSize: 12, color: '#606068', textAlign: 'center', marginTop: 4 }}>Embedding → Vector search → Gemini analysis…</div>
          </div>
        )}

        {/* Error */}
        {err && !loading && (
          <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>⚠ Failed</div>{err}
          </div>
        )}

        {/* Result */}
        {result && !loading && qId && <ResultView result={result} qId={qId} ms={meta.ms} model={meta.model} />}

        {/* Empty */}
        {!result && !loading && !err && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#606068' }}>
            <div>
              <div style={{ fontSize: 48, opacity: 0.2, marginBottom: 10 }}>🧠</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Ready to analyze</div>
              <div style={{ fontSize: 12, lineHeight: 1.6, maxWidth: 240 }}>Type a research question above. The AI will search {doc.chunk_count} indexed chunks.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
