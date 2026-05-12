// POST /api/documents/upload
// Accepts multipart/form-data with a single 'file' field
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAdminSupabase } from '@/lib/supabase/server'
import { extractTextFromFile, validateFileSize } from '@/lib/ai/document-processor'
import { indexDocument } from '@/lib/ai/rag-pipeline'
import { PLAN_LIMITS } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Load user profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('plan, credits')
      .eq('id', user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Count active documents (exclude errors)
    const { count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('status', ['processing', 'ready'])

    const maxDocs = PLAN_LIMITS[profile.plan].max_documents
    if ((count || 0) >= maxDocs) {
      return NextResponse.json(
        {
          error: `Document limit reached (${count}/${maxDocs}). ${
            profile.plan === 'free'
              ? 'Upgrade to Premium to upload up to 3 documents.'
              : 'Premium plan allows up to 3 documents.'
          }`,
        },
        { status: 403 }
      )
    }

    // Parse the uploaded file
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
    if (!['pdf', 'txt', 'md'].includes(fileExt)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, TXT, or MD file.' },
        { status: 400 }
      )
    }

    // Validate file size against plan limits
    const sizeCheck = validateFileSize(file.size, profile.plan)
    if (!sizeCheck.valid) {
      return NextResponse.json({ error: sizeCheck.message }, { status: 400 })
    }

    // Read and extract text
    const buffer = Buffer.from(await file.arrayBuffer())
    let rawText: string
    try {
      rawText = await extractTextFromFile(buffer, fileExt)
    } catch (extractErr) {
      return NextResponse.json(
        {
          error: `Could not read file: ${
            extractErr instanceof Error ? extractErr.message : 'Unsupported format'
          }`,
        },
        { status: 422 }
      )
    }

    const cleanedText = rawText.trim()
    if (cleanedText.length < 100) {
      return NextResponse.json(
        { error: 'Document contains too little text (minimum 100 characters)' },
        { status: 422 }
      )
    }

    // Derive a readable title from filename
    const title = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const adminSupabase = createAdminSupabase()

    // Create the document record with status 'processing'
    const { data: doc, error: docErr } = await adminSupabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: title.slice(0, 200),
        original_filename: file.name,
        file_type: fileExt as 'pdf' | 'txt' | 'md',
        file_size: file.size,
        raw_text: cleanedText.substring(0, 50_000), // cap stored text at 50K chars
        status: 'processing',
        chunk_count: 0,
      })
      .select()
      .single()

    if (docErr || !doc) {
      throw new Error(`Failed to create document record: ${docErr?.message}`)
    }

    // Index the document (chunk + embed + store)
    try {
      const chunkCount = await indexDocument(doc.id, user.id, cleanedText)

      await adminSupabase
        .from('documents')
        .update({ status: 'ready', chunk_count: chunkCount })
        .eq('id', doc.id)

      return NextResponse.json({
        document: { ...doc, status: 'ready', chunk_count: chunkCount },
        message: `"${title}" processed successfully (${chunkCount} semantic chunks indexed)`,
      })
    } catch (indexErr) {
      // Mark doc as errored so user can retry
      await adminSupabase
        .from('documents')
        .update({ status: 'error' })
        .eq('id', doc.id)

      throw indexErr
    }
  } catch (err) {
    console.error('Document upload error:', err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'An unexpected error occurred during upload',
      },
      { status: 500 }
    )
  }
}
