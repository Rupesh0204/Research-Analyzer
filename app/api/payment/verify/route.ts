// POST /api/payment/verify
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { createHmac } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    // Verify Razorpay signature (HMAC-SHA256)
    const secret = process.env.RAZORPAY_KEY_SECRET!
    const body_str = `${razorpay_order_id}|${razorpay_payment_id}`
    const expectedSignature = createHmac('sha256', secret)
      .update(body_str)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    const adminSupabase = createAdminSupabase()

    // Check for duplicate processing
    const { data: existingTx } = await adminSupabase
      .from('transactions')
      .select('status')
      .eq('razorpay_order_id', razorpay_order_id)
      .single()

    if (existingTx?.status === 'paid') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 409 })
    }

    // Update transaction
    await adminSupabase
      .from('transactions')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'paid',
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('user_id', user.id)

    // Upgrade user plan and add credits
    await adminSupabase
      .from('profiles')
      .update({
        plan: 'premium',
        credits: 50,
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      message: 'Payment verified! Your account has been upgraded to Premium.',
      plan: 'premium',
      credits: 50,
    })
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Payment verification failed',
    }, { status: 500 })
  }
}
