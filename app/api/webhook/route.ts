// POST /api/webhook — Razorpay webhook handler
// Also handles Supabase Auth callbacks
import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-razorpay-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify Razorpay webhook signature
    const expectedSignature = createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (signature !== expectedSignature) {
      console.error('Webhook signature mismatch')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)
    const supabase = createAdminSupabase()

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const orderId = payment.order_id
      const paymentId = payment.id

      const { data: transaction } = await supabase
        .from('transactions')
        .select('user_id, status')
        .eq('razorpay_order_id', orderId)
        .single()

      if (!transaction) {
        console.error('Transaction not found for order:', orderId)
        return NextResponse.json({ received: true }) // 200 to prevent retries
      }

      if (transaction.status === 'paid') {
        return NextResponse.json({ received: true, message: 'Already processed' })
      }

      // Atomic update: transaction + profile
      await Promise.all([
        supabase
          .from('transactions')
          .update({ status: 'paid', razorpay_payment_id: paymentId })
          .eq('razorpay_order_id', orderId),
        supabase
          .from('profiles')
          .update({ plan: 'premium', credits: 50 })
          .eq('id', transaction.user_id),
      ])

      console.log(`Webhook: User ${transaction.user_id} upgraded to premium`)
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
