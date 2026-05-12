// POST /api/queries/generate — Full RAG pipeline endpoint
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createAdminSupabase } from '@/lib/supabase/server'
import { runRAGPipeline } from '@/lib/ai/rag-pipeline'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { query, document_id } = body

    if (!query || !document_id) {
      return NextResponse.json(
        { error: 'query and document_id are required' },
        { status: 400 }
      )
    }
    if (query.trim().length < 10) {
      return NextResponse.json(
        { error: 'Query must be at least 10 characters long' },
        { status: 400 }
      )
    }

    // Load profile — include total_queries for the update
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, credits, total_queries')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }
    if (profile.credits <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining. Upgrade to Premium for more credits.' },
        { status: 402 }
      )
    }

    // Verify document belongs to user and is ready
    const { data: document } = await supabase
      .from('documents')
      .select('id, title, status')
      .eq('id', document_id)
      .eq('user_id', user.id)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }
    if (document.status !== 'ready') {
      return NextResponse.json(
        { error: 'Document is still processing. Please wait a moment and try again.' },
        { status: 422 }
      )
    }

    const adminSupabase = createAdminSupabase()

    // Create query record (status: processing)
    const { data: queryRecord, error: queryError } = await adminSupabase
      .from('research_queries')
      .insert({
        user_id: user.id,
        document_id,
        query: query.trim(),
        status: 'processing',
        credits_used: 1,
      })
      .select()
      .single()

    if (queryError || !queryRecord) {
      throw new Error(`Failed to create query record: ${queryError?.message}`)
    }

    // Deduct credit + increment query count optimistically
    await adminSupabase
      .from('profiles')
      .update({
        credits: profile.credits - 1,
        total_queries: (profile.total_queries || 0) + 1,
      })
      .eq('id', user.id)

    // Run RAG pipeline
    try {
      const { result, model, chunksUsed } = await runRAGPipeline(
        query.trim(),
        user.id,
        document_id,
        profile.plan
      )

      const processingTime = Date.now() - startTime

      // Save completed result
      await adminSupabase
        .from('research_queries')
        .update({
          result,
          status: 'completed',
          model_used: model,
          processing_time_ms: processingTime,
        })
        .eq('id', queryRecord.id)

      return NextResponse.json({
        query_id: queryRecord.id,
        result,
        credits_remaining: profile.credits - 1,
        processing_time_ms: processingTime,
        model_used: model,
        chunks_analyzed: chunksUsed,
      })
    } catch (ragError) {
      // Refund credit on failure
      await adminSupabase
        .from('profiles')
        .update({
          credits: profile.credits,
          total_queries: profile.total_queries || 0,
        })
        .eq('id', user.id)

      await adminSupabase
        .from('research_queries')
        .update({
          status: 'error',
          error_message:
            ragError instanceof Error ? ragError.message : 'Unknown RAG error',
        })
        .eq('id', queryRecord.id)

      throw ragError
    }
  } catch (error) {
    console.error('Research generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
