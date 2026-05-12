// GET /api/documents/list
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('id, title, original_filename, file_type, file_size, chunk_count, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 })
  }

  return NextResponse.json({ documents: documents || [] })
}

// DELETE /api/documents/list?id=xxx
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const documentId = searchParams.get('id')
  
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
  }

  // Chunks are deleted via CASCADE
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
