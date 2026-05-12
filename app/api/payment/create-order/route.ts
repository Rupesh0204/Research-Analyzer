// POST /api/payment/create-order
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'premium') {
      return NextResponse.json({ error: 'Already on premium plan' }, { status: 400 })
    }

    const amount = parseInt(process.env.NEXT_PUBLIC_PREMIUM_PRICE_PAISE || '100')

    // Create Razorpay order
    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeyId || !razorpaySecret) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    // Call Razorpay API to create order
    const credentials = Buffer.from(`${razorpayKeyId}:${razorpaySecret}`).toString('base64')
    
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,          // in paise
        currency: 'INR',
        receipt: `receipt_${user.id.substring(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          plan: 'premium',
        },
      }),
    })

    if (!rzpResponse.ok) {
      const err = await rzpResponse.text()
      throw new Error(`Razorpay order creation failed: ${err}`)
    }

    const order = await rzpResponse.json()

    // Save transaction in DB
    const adminSupabase = createAdminSupabase()
    await adminSupabase.from('transactions').insert({
      user_id: user.id,
      razorpay_order_id: order.id,
      amount,
      currency: 'INR',
      status: 'created',
      plan_upgraded_to: 'premium',
      credits_added: 40, // 50 - 10 (difference)
    })

    return NextResponse.json({
      order_id: order.id,
      amount,
      currency: 'INR',
      key_id: razorpayKeyId,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create payment order',
    }, { status: 500 })
  }
}
