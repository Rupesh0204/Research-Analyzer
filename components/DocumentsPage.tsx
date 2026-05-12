'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ResearchPanel from '@/components/ResearchPanel'

interface Doc { id: string; title: string; original_filename: string; file_type: string; file_size: number; chunk_count: number; status: string; created_at: string }
interface Profile { id: string; email: string; plan: string; credits: number; full_name: string | null }

function fmtBytes(b: number) {
  if (b < 1024) return b + 'B'
  if (b < 1048576) return (b / 1024).toFixed(1) + 'KB'
  return (b / 1048576).toFixed(1) + 'MB'
}

function StatusDot({ status }: { status: string }) {
  const c = status === 'ready' ? '#22c55e' : status === 'error' ? '#ef4444' : '#f59e0b'
  return <span style={{ color: c, fontSize: 11, fontFamily: 'monospace' }}>● {status}</span>
}

export default function DocumentsPage({ profile, initialDocs, maxDocs }: { profile: Profile; initialDocs: Doc[]; maxDocs: number }) {
  const [docs, setDocs] = useState<Doc[]>(initialDocs)
  const [selected, setSelected] = useState<Doc | null>(initialDocs.find(d => d.status === 'ready') || null)
  const [uploading, setUploading] = useState(false)
  const [uploadStep, setUploadStep] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const activeDocs = docs.filter(d => d.status !== 'error').length
  const canUpload = activeDocs < maxDocs

  const onDrop = useCallback(async (accepted: File[], rejected: any[]) => {
    if (rejected.length) { toast.error('Invalid file. Use PDF, TXT, or MD (max ' + (profile.plan === 'premium' ? '20' : '5') + 'MB)'); return }
    const file = accepted[0]; if (!file) return
    if (!canUpload) { toast.error(`Limit reached (${activeDocs}/${maxDocs}). ${profile.plan === 'free' ? 'Upgrade for 3 docs.' : ''}`); return }
    setUploading(true); setUploadStep('Extracting text…')
    const tid = toast.loading(`Processing "${file.name}"…`)
    try {
      setUploadStep('Generating embeddings…')
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/documents/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message, { id: tid, duration: 5000 })
      setDocs(prev => [data.document, ...prev])
      setSelected(data.document)
    } catch (e: any) { toast.error(e.message || 'Upload failed', { id: tid }) }
    finally { setUploading(false); setUploadStep('') }
  }, [canUpload, activeDocs, maxDocs, profile.plan])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'text/markdown': ['.md'] },
    maxFiles: 1,
    maxSize: (profile.plan === 'premium' ? 20 : 5) * 1048576,
    disabled: uploading || !canUpload,
  })

  async function deleteDoc(id: string) {
    if (!confirm('Delete this document and all its data?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/documents/list?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      setDocs(p => p.filter(d => d.id !== id))
      if (selected?.id === id) setSelected(docs.find(d => d.id !== id && d.status === 'ready') || null)
      toast.success('Document deleted')
    } catch (e: any) { toast.error(e.message) }
    finally { setDeleting(null) }
  }

  const card: React.CSSProperties = { background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 12 }

  return (
    <div style={{ padding: 28, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Documents</h1>
          <p style={{ color: '#9898a0', fontSize: 13 }}>Upload → Index → Research · <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>{activeDocs}/{maxDocs}</span> slots used</p>
        </div>
        {profile.plan === 'free' && (
          <Link href="/upgrade" style={{ padding: '8px 16px', background: '#f59e0b', color: '#000', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>Upgrade → 3 docs</Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* LEFT: Upload + list */}
        <div>
          {/* Dropzone */}
          <div {...getRootProps()} style={{ ...card, padding: 20, textAlign: 'center', cursor: canUpload && !uploading ? 'pointer' : 'not-allowed', opacity: !canUpload || uploading ? 0.5 : 1, borderStyle: 'dashed', borderColor: isDragActive ? '#f59e0b' : '#2e2e34', background: isDragActive ? 'rgba(245,158,11,0.06)' : '#1a1a1d', marginBottom: 12, transition: 'all 0.2s' }}>
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <div style={{ fontSize: 28, marginBottom: 8, display: 'inline-block' }} className="spin">⟳</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{uploadStep}</div>
                <div style={{ fontSize: 11, color: '#606068', marginTop: 4 }}>~15–30 seconds</div>
              </>
            ) : isDragActive ? (
              <>
                <div style={{ fontSize: 28, color: '#f59e0b', marginBottom: 8 }}>↓</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#f59e0b' }}>Drop it!</div>
              </>
            ) : canUpload ? (
              <>
                <div style={{ fontSize: 28, color: '#606068', marginBottom: 8 }}>↑</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Drop file or click to upload</div>
                <div style={{ fontSize: 11, color: '#606068' }}>PDF, TXT, MD · max {profile.plan === 'premium' ? '20' : '5'}MB</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⊘</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>Limit reached</div>
                {profile.plan === 'free' && <Link href="/upgrade" style={{ fontSize: 12, color: '#f59e0b', textDecoration: 'underline' }}>Upgrade for 3 docs</Link>}
              </>
            )}
          </div>

          {/* Usage bar */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#606068', marginBottom: 4, fontFamily: 'monospace' }}>
              <span>Documents used</span><span>{activeDocs}/{maxDocs}</span>
            </div>
            <div style={{ height: 3, background: '#2e2e34', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(3, (activeDocs / maxDocs) * 100)}%`, background: '#f59e0b', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          </div>

          {/* Doc list */}
          {docs.length === 0 ? (
            <div style={{ ...card, padding: 24, textAlign: 'center', color: '#606068' }}>
              <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 8 }}>📄</div>
              <div style={{ fontSize: 13 }}>No documents yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Upload a PDF, TXT, or MD file above</div>
            </div>
          ) : docs.map(doc => {
            const isSel = selected?.id === doc.id
            const isReady = doc.status === 'ready'
            return (
              <div key={doc.id} onClick={() => isReady && setSelected(doc)}
                style={{ ...card, padding: 12, marginBottom: 8, cursor: isReady ? 'pointer' : 'default', background: isSel ? 'rgba(245,158,11,0.08)' : '#1a1a1d', borderColor: isSel ? 'rgba(245,158,11,0.4)' : '#2e2e34', position: 'relative', transition: 'all 0.15s' }}>
                {isSel && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 28, background: '#f59e0b', borderRadius: '0 3px 3px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, background: '#1e1e22', color: '#9898a0', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0, marginTop: 1 }}>{doc.file_type}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{doc.title}</div>
                    <div style={{ fontSize: 11, color: '#606068', fontFamily: 'monospace', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span>{fmtBytes(doc.file_size)}</span>
                      {doc.chunk_count > 0 && <><span>·</span><span>{doc.chunk_count} chunks</span></>}
                    </div>
                    <div style={{ marginTop: 4 }}><StatusDot status={doc.status} /></div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteDoc(doc.id) }} disabled={deleting === doc.id}
                    style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', width: 22, height: 22, borderRadius: 6, fontSize: 13, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {deleting === doc.id ? '…' : '×'}
                  </button>
                </div>
              </div>
            )
          })}

          <div style={{ ...card, padding: '10px 12px', fontSize: 11, color: '#606068', marginTop: 8 }}>
            Supported: <strong style={{ color: '#9898a0' }}>PDF</strong> (text-based), <strong style={{ color: '#9898a0' }}>TXT</strong>, <strong style={{ color: '#9898a0' }}>MD</strong>
          </div>
        </div>

        {/* RIGHT: Research panel */}
        {selected ? (
          <ResearchPanel doc={selected} profile={profile} />
        ) : (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 520, textAlign: 'center', color: '#606068' }}>
            <div>
              <div style={{ fontSize: 52, opacity: 0.2, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Select a document</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 260 }}>
                Click on a <span style={{ color: '#22c55e' }}>● ready</span> document on the left to open the AI research panel
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
