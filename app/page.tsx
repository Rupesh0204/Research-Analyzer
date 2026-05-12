import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ background: '#0f0f11', minHeight: '100vh', color: '#f1f1f3', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid #2e2e34' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#000', fontWeight: 800, fontSize: 14 }}>R</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>ResearchAI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ padding: '8px 16px', color: '#9898a0', fontSize: 14 }}>Sign In</Link>
          <Link href="/signup" style={{ padding: '8px 20px', background: '#f59e0b', color: '#000', borderRadius: 8, fontWeight: 700, fontSize: 14 }}>
            Get Started Free
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.15, marginBottom: 20, letterSpacing: '-1px' }}>
          AI-Powered Research<br /><span style={{ color: '#f59e0b' }}>in seconds.</span>
        </h1>
        <p style={{ fontSize: 18, color: '#9898a0', marginBottom: 40, lineHeight: 1.7 }}>
          Upload any document. Ask research questions. Get structured AI reports with citations, key insights, and confidence scores.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 60 }}>
          <Link href="/signup" style={{ padding: '14px 32px', background: '#f59e0b', color: '#000', borderRadius: 10, fontWeight: 700, fontSize: 16 }}>
            Start Free — 10 Credits
          </Link>
          <Link href="/login" style={{ padding: '14px 32px', color: '#9898a0', border: '1px solid #2e2e34', borderRadius: 10, fontSize: 16 }}>
            Sign In →
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '📄', title: 'Upload Documents', desc: 'PDF, TXT, MD files — automatic text extraction and semantic chunking' },
            { icon: '🔍', title: 'Semantic Search', desc: 'pgvector similarity search finds the most relevant passages instantly' },
            { icon: '🧠', title: 'AI Analysis', desc: 'Gemini generates structured reports with citations and confidence scores' },
          ].map(f => (
            <div key={f.title} style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 12, padding: 20, textAlign: 'left' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: '#9898a0', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, padding: 16, background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 10, fontSize: 12, color: '#606068' }}>
          🧪 Test card: <span style={{ fontFamily: 'monospace', color: '#f1f1f3' }}>4111 1111 1111 1111</span> · Expiry: any future date · CVV: 123 · OTP: 1234
        </div>
      </div>
    </div>
  )
}
