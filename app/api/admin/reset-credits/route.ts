// POST /api/admin/reset-credits — Dev only, requires x-admin-secret header
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret')
  if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const credits = typeof body.credits === 'number' ? body.credits : 10

  const admin = createAdminSupabase()
  const { data, error: upErr } = await admin
    .from('profiles')
    .update({ credits })
    .eq('id', user.id)
    .select('id, email, credits, plan')
    .single()

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  return NextResponse.json({ success: true, message: `Credits reset to ${credits}`, profile: data })
}
