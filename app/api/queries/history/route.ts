// GET /api/queries/history
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = parseInt(searchParams.get('offset') || '0')

  const { data: queries, error: qError } = await supabase
    .from('research_queries')
    .select(`
      id, query, result, credits_used, model_used,
      processing_time_ms, status, error_message, created_at,
      documents(title, original_filename)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 })
  }

  return NextResponse.json({ queries: queries || [] })
}
