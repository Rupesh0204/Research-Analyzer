'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#f1f1f3' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Something went wrong</h2>
        <p style={{ color: '#9898a0', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>{error.message || 'An unexpected error occurred.'}</p>
        <button onClick={reset} style={{ padding: '10px 24px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )
}
