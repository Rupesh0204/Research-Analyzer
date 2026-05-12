import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'

// GET /api/user/profile
export async function GET() {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  return NextResponse.json({ profile })
}

// PATCH /api/user/profile — update display name
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { full_name } = body

  if (!full_name || full_name.trim().length < 1) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
  }
  if (full_name.trim().length > 100) {
    return NextResponse.json({ error: 'Name is too long (max 100 chars)' }, { status: 400 })
  }

  const { data, error: updateError } = await supabase
    .from('profiles')
    .update({ full_name: full_name.trim() })
    .eq('id', user.id)
    .select()
    .single()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  return NextResponse.json({ profile: data })
}

// DELETE /api/user/profile — delete account and all data
export async function DELETE() {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminSupabase()

  // Delete all user data (cascade handles documents, chunks, queries, transactions)
  await admin.from('profiles').delete().eq('id', user.id)

  // Delete auth user
  const { error: deleteAuthError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteAuthError) {
    console.error('Auth user deletion error:', deleteAuthError)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
