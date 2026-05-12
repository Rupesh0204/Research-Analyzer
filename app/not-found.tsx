import Link from 'next/link'
export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f11', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#f1f1f3' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 72, fontWeight: 800, color: '#f59e0b', lineHeight: 1 }}>404</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '16px 0 8px' }}>Page not found</h2>
        <p style={{ color: '#9898a0', marginBottom: 24 }}>This page doesn't exist.</p>
        <Link href="/dashboard" style={{ padding: '10px 24px', background: '#f59e0b', color: '#000', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>Go to Dashboard →</Link>
      </div>
    </div>
  )
}
