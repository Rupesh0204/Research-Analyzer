'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Document, Profile, ResearchResult } from '@/types'

function ConfBar({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--accent)' : 'var(--red)'
  const label = pct >= 80 ? 'High' : pct >= 60 ? 'Medium' : 'Low'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace', minWidth: 32 }}>{pct}%</span>
      <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{label}</span>
    </div>
  )
}

function ResultView({ result, queryId, ms, model }: { result: ResearchResult; queryId: string; ms?: number; model?: string }) {
  async function copy() {
    const text = [
      `Topic: ${result.topic}`, '',
      `Summary:\n${result.summary}`, '',
      `Key Points:\n${result.key_points.map((p,i)=>`${i+1}. ${p}`).join('\n')}`, '',
      `Insights:\n${result.insights.map(i=>`• ${i}`).join('\n')}`, '',
      `Confidence: ${Math.round(result.confidence_score*100)}%`,
    ].join('\n')
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }
  function dl(fmt: 'json'|'txt') {
    window.open(`/api/queries/export?id=${queryId}&format=${fmt}`, '_blank')
    toast.success(`Downloading .${fmt}`)
  }

  const S: Record<string,React.CSSProperties> = {
    sectionTitle: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)', marginBottom: 8 },
    box: { background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' },
    tag: { fontSize: 11, padding: '2px 8px', borderRadius: 99, fontFamily: 'monospace', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' },
    point: { display: 'flex', gap: 8, padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, marginBottom: 6 },
    insight: { padding: '10px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, fontSize: 13, marginBottom: 6 },
    cite: { padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, marginBottom: 6 },
    btn: { fontSize: 12, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Meta + actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {model && <span style={S.tag}>{model.replace('gemini-1.5-','')}</span>}
          {ms && <span style={S.tag}>{(ms/1000).toFixed(1)}s</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={S.btn} onClick={copy}
            onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border-2)';(e.currentTarget as HTMLButtonElement).style.color='var(--text)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)';(e.currentTarget as HTMLButtonElement).style.color='var(--text-muted)'}}>
            Copy
          </button>
          {(['txt','json'] as const).map(f=>(
            <button key={f} style={S.btn} onClick={()=>dl(f)}
              onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border-2)';(e.currentTarget as HTMLButtonElement).style.color='var(--text)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor='var(--border)';(e.currentTarget as HTMLButtonElement).style.color='var(--text-muted)'}}>
              .{f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <ConfBar score={result.confidence_score} />

      <div>
        <div style={S.sectionTitle}>Topic</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.3 }}>{result.topic}</div>
      </div>

      <div>
        <div style={S.sectionTitle}>Summary</div>
        <div style={{ ...S.box, fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>{result.summary}</div>
      </div>

      {result.key_points?.length > 0 && (
        <div>
          <div style={S.sectionTitle}>Key Points ({result.key_points.length})</div>
          {result.key_points.map((pt,i) => (
            <div key={i} style={S.point}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>→</span>
              <span style={{ color: 'var(--text)' }}>{pt}</span>
            </div>
          ))}
        </div>
      )}

      {result.insights?.length > 0 && (
        <div>
          <div style={S.sectionTitle}>Insights</div>
          {result.insights.map((ins,i) => (
            <div key={i} style={S.insight}>
              <span style={{ marginRight: 8 }}>💡</span><span style={{ color: 'var(--text)' }}>{ins}</span>
            </div>
          ))}
        </div>
      )}

      {result.citations?.length > 0 && (
        <div>
          <div style={S.sectionTitle}>Citations ({result.citations.length})</div>
          {result.citations.map((c:any,i:number) => (
            <div key={i} style={S.cite}>
              <div style={{ fontFamily:'monospace', fontSize:11, color:'var(--text-dim)', marginBottom:4 }}>
                [{i+1}] {c.source}{c.relevance_score != null && <span style={{color:'var(--accent)',marginLeft:8}}>{Math.round(Number(c.relevance_score)*100)}% match</span>}
              </div>
              <div style={{ fontStyle:'italic', color:'var(--text-muted)' }}>&ldquo;{c.text}&rdquo;</div>
            </div>
          ))}
        </div>
      )}

      {result.limitations && (
        <div style={{ ...S.box, fontSize: 12, color: 'var(--text-muted)', borderColor: 'var(--border-2)' }}>
          <strong>⚠ Limitations: </strong>{result.limitations}
        </div>
      )}
    </div>
  )
}

export default function ResearchPanel({ document, profile }: { document: Document; profile: Profile }) {
  const [query,    setQuery]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<ResearchResult|null>(null)
  const [queryId,  setQueryId]  = useState<string|null>(null)
  const [meta,     setMeta]     = useState<{ms?:number;model?:string;credits?:number;chunks?:number}>({})
  const [err,      setErr]      = useState<string|null>(null)

  const canQuery = profile.credits > 0 && document.status === 'ready'
  const tooShort = query.trim().length < 10

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (tooShort || !canQuery) return
    setLoading(true); setResult(null); setErr(null); setQueryId(null)
    const tid = toast.loading('Running RAG pipeline…')
    try {
      const res  = await fetch('/api/queries/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ query: query.trim(), document_id: document.id }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.result); setQueryId(data.query_id)
      setMeta({ ms: data.processing_time_ms, model: data.model_used, credits: data.credits_remaining, chunks: data.chunks_analyzed })
      toast.success(`Done! ${data.credits_remaining} credits left · ${data.chunks_analyzed} chunks analyzed`, { id: tid, duration: 5000 })
    } catch(e:any) {
      setErr(e.message || 'Generation failed')
      toast.error(e.message, { id: tid })
    } finally { setLoading(false) }
  }

  const S: Record<string,React.CSSProperties> = {
    wrap:   { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, display:'flex', flexDirection:'column', height:'100%', minHeight:520, overflow:'hidden' },
    head:   { padding:'14px 18px', borderBottom:'1px solid var(--border)', background:'var(--surface-2)' },
    body:   { flex:1, padding:'18px', overflowY:'auto', display:'flex', flexDirection:'column' },
    label:  { fontSize:11, fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.06em', color:'var(--text-dim)', marginBottom:6, display:'block' },
    area:   { width:'100%', minHeight:80, padding:'10px 14px', background:'var(--surface-2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text)', fontSize:13, fontFamily:'Inter,sans-serif', resize:'vertical' as const, outline:'none', lineHeight:1.6, transition:'border-color 0.15s, box-shadow 0.15s' },
    count:  { fontSize:11, fontFamily:'monospace', textAlign:'right' as const, marginTop:4, color:'var(--text-dim)' },
    btn:    { width:'100%', padding:'11px', background:'var(--accent)', color:'#000', border:'none', borderRadius:10, fontWeight:700, fontSize:14, cursor:'pointer', transition:'all 0.15s', marginTop:10 },
  }

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.head}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
          <span style={{ color:'var(--accent)', fontSize:16 }}>◈</span>
          <span style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{document.title}</span>
          <span style={{ marginLeft:'auto', fontSize:11, fontFamily:'monospace', padding:'2px 8px', borderRadius:99,
            background: document.status==='ready' ? 'var(--green-dim)' : 'rgba(245,158,11,0.1)',
            color: document.status==='ready' ? 'var(--green)' : 'var(--accent)',
          }}>● {document.status}</span>
        </div>
        <div style={{ fontSize:12, color:'var(--text-dim)', fontFamily:'monospace' }}>
          {document.chunk_count} chunks · {profile.credits} credits left
          {meta.credits != null && meta.credits !== profile.credits && (
            <span style={{ color:'var(--accent)', marginLeft:8 }}>→ now {meta.credits}</span>
          )}
        </div>
      </div>

      <div style={S.body}>
        {/* Query form */}
        <form onSubmit={submit} style={{ marginBottom:20 }}>
          <label style={S.label}>Research Query</label>
          <textarea
            value={query}
            onChange={e=>setQuery(e.target.value)}
            disabled={loading || !canQuery}
            placeholder={
              !canQuery
                ? profile.credits <= 0 ? 'No credits left — upgrade to continue' : 'Document is not ready…'
                : 'What are the main findings? Explain the methodology… Summarize the key conclusions…'
            }
            style={{ ...S.area,
              borderColor: query.length > 0 && tooShort ? 'var(--red)' : 'var(--border)',
              opacity: (!canQuery || loading) ? 0.5 : 1,
              cursor: !canQuery ? 'not-allowed' : 'auto',
            }}
            onFocus={e => { if(canQuery) (e.target as HTMLTextAreaElement).style.borderColor='var(--accent)'; (e.target as HTMLTextAreaElement).style.boxShadow='0 0 0 3px rgba(245,158,11,0.1)' }}
            onBlur={e  => { (e.target as HTMLTextAreaElement).style.borderColor='var(--border)'; (e.target as HTMLTextAreaElement).style.boxShadow='none' }}
          />
          <div style={{ ...S.count, color: tooShort && query.length > 0 ? 'var(--red)' : 'var(--text-dim)' }}>
            {query.trim().length}/10 min chars
          </div>
          <button
            type="submit"
            disabled={loading || !canQuery || tooShort}
            style={{ ...S.btn,
              opacity: (loading || !canQuery || tooShort) ? 0.4 : 1,
              cursor: (loading || !canQuery || tooShort) ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if(!(loading || !canQuery || tooShort)) { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 4px 16px rgba(245,158,11,0.3)' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='none' }}
          >
            {loading ? '⟳ Analyzing document…' : `Generate Report — 1 Credit (${profile.credits} left)`}
          </button>
        </form>

        {/* Skeleton */}
        {loading && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12 }}>
            <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.9}}`}</style>
            {[100,75,50,90,60].map((w,i) => (
              <div key={i} style={{ height: i===1?60:16, width:`${w}%`, borderRadius:8, background:`#27272a`, animation:`pulse 1.5s ease-in-out infinite`, animationDelay:`${i*0.1}s` }} />
            ))}
            <div style={{ fontSize:13, color:'var(--text-dim)', textAlign:'center', marginTop:8 }}>
              Embedding query → Searching chunks → Generating report…
            </div>
          </div>
        )}

        {/* Error */}
        {err && !loading && (
          <div style={{ padding:'14px', background:'var(--red-dim)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, fontSize:13, color:'var(--red)' }}>
            <div style={{ fontWeight:600, marginBottom:4 }}>⚠ Generation Failed</div>
            {err}
          </div>
        )}

        {/* Result */}
        {result && !loading && queryId && (
          <ResultView result={result} queryId={queryId} ms={meta.ms} model={meta.model} />
        )}

        {/* Empty */}
        {!result && !loading && !err && (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', color:'var(--text-dim)' }}>
            <div>
              <div style={{ fontSize:48, marginBottom:12, opacity:0.3 }}>🧠</div>
              <div style={{ fontWeight:500, fontSize:14, marginBottom:6 }}>Ready to analyze</div>
              <div style={{ fontSize:13, maxWidth:260, lineHeight:1.6 }}>
                Enter a research question above. The AI will search {document.chunk_count} indexed chunks.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
