'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

declare global { interface Window { Razorpay: any } }

interface Profile { email: string; full_name: string | null; plan: string }

export default function UpgradeView({ profile }: { profile: Profile }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleUpgrade() {
    if (profile.plan === 'premium') { toast('Already on Premium! 🎉'); return }
    setLoading(true)
    try {
      // Load Razorpay script
      if (!window.Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => res(); s.onerror = () => rej(new Error('Could not load Razorpay'))
          document.head.appendChild(s)
        })
      }
      const r = await fetch('/api/payment/create-order', { method: 'POST' })
      const order = await r.json()
      if (!r.ok) throw new Error(order.error)

      new window.Razorpay({
        key: order.key_id, amount: order.amount, currency: order.currency,
        order_id: order.order_id, name: 'ResearchAI', description: 'Upgrade to Premium',
        prefill: { email: profile.email, name: profile.full_name || '' },
        theme: { color: '#f59e0b' },
        handler: async (resp: any) => {
          const v = await fetch('/api/payment/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resp) })
          const d = await v.json()
          if (!v.ok) { toast.error(d.error); return }
          toast.success('🎉 Upgraded to Premium! Enjoy 50 credits.')
          router.push('/dashboard'); router.refresh()
        },
        modal: { ondismiss: () => setLoading(false) },
      }).open()
    } catch (e: any) { toast.error(e.message); setLoading(false) }
  }

  const card: React.CSSProperties = { background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 14, padding: 24 }
  const feat = (t: string) => (
    <div key={t} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#9898a0', padding: '3px 0' }}>
      <span style={{ color: '#f59e0b' }}>✓</span>{t}
    </div>
  )

  return (
    <div style={{ padding: 28, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        {profile.plan === 'premium' ? '★ You\'re on Premium!' : 'Upgrade to Premium'}
      </h1>
      <p style={{ color: '#9898a0', fontSize: 13, marginBottom: 24 }}>
        {profile.plan === 'premium' ? 'Full access to all features' : 'Get more credits, more documents, and the better AI model'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Free */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Free</span>
            {profile.plan === 'free' && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 99, background: '#1e1e22', color: '#9898a0', border: '1px solid #2e2e34' }}>CURRENT</span>}
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, marginBottom: 16 }}>₹0</div>
          {['10 credits', '1 document', 'Gemini Flash', 'Basic reports'].map(feat)}
        </div>

        {/* Premium */}
        <div style={{ ...card, background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.35)', boxShadow: '0 0 24px rgba(245,158,11,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Premium</span>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', padding: '2px 7px', borderRadius: 99, background: profile.plan === 'premium' ? '#f59e0b' : 'rgba(245,158,11,0.2)', color: profile.plan === 'premium' ? '#000' : '#f59e0b' }}>
              {profile.plan === 'premium' ? 'ACTIVE' : 'BEST VALUE'}
            </span>
          </div>
          <div style={{ fontSize: 34, fontWeight: 800, color: '#f59e0b', marginBottom: 3 }}>₹1</div>
          <div style={{ fontSize: 11, color: '#606068', fontFamily: 'monospace', marginBottom: 16 }}>test mode</div>
          {['50 credits', '3 documents', 'Gemini Pro', 'Export .json / .txt', 'Priority access'].map(feat)}
          {profile.plan === 'free' && (
            <button onClick={handleUpgrade} disabled={loading}
              style={{ width: '100%', padding: '11px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 20, opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>
              {loading ? 'Opening checkout…' : 'Upgrade Now — ₹1 →'}
            </button>
          )}
        </div>
      </div>

      {/* Test card info */}
      <div style={{ background: '#1a1a1d', border: '1px solid #2e2e34', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontWeight: 600, color: '#f59e0b', marginBottom: 10, fontSize: 13 }}>🧪 Razorpay Test Mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '5px 16px', fontSize: 13 }}>
          {[['Card', '4100 2800 0000 1007'], ['Expiry', 'Any future (e.g. 12/27)'], ['CVV', 'Any 3 digits'], ['OTP', '1234']].map(([k, v]) => (
            <>
              <span key={'k-' + k} style={{ color: '#9898a0' }}>{k}</span>
              <span key={'v-' + k} style={{ fontFamily: 'monospace', color: '#f1f1f3' }}>{v}</span>
            </>
          ))}
        </div>
      </div>
    </div>
  )
}
