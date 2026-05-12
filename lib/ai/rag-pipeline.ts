// ============================================================
// RAG Pipeline — Core orchestration
//
// Flow:
// 1. generateEmbedding(query)        → 384-dim vector
// 2. match_document_chunks()         → top-K similar chunks via pgvector
// 3. buildContext(chunks)            → concatenated text
// 4. generateResearchReport()        → structured JSON from LLM
// ============================================================

import { createAdminSupabase } from '@/lib/supabase/server'
import { generateEmbedding, generateEmbeddingsBatch } from './embeddings'
import { generateResearchReport } from './llm'
import { chunkText } from './chunker'
import { ResearchResult, SimilarChunk } from '@/types'

const TOP_K_CHUNKS = 5
const SIMILARITY_THRESHOLD = 0.25  // Lower = cast wider net; raise if too much noise

// ---- RAG Query Pipeline ----

interface RAGResult {
  result: ResearchResult
  model: string
  chunksUsed: number
}

export async function runRAGPipeline(
  query: string,
  userId: string,
  documentId: string,
  plan: 'free' | 'premium'
): Promise<RAGResult> {
  const supabase = createAdminSupabase()

  // Step 1: Embed the user query
  const queryEmbedding = await generateEmbedding(query)

  // Step 2: Vector similarity search via pgvector
  const { data: chunks, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: queryEmbedding,
    match_user_id: userId,
    match_document_id: documentId,
    match_threshold: SIMILARITY_THRESHOLD,
    match_count: TOP_K_CHUNKS,
  })

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`)
  }

  if (!chunks || chunks.length === 0) {
    // Fallback: if no vector match, grab first N chunks of the document
    const { data: fallbackChunks, error: fallbackErr } = await supabase
      .from('document_chunks')
      .select('id, document_id, content')
      .eq('user_id', userId)
      .eq('document_id', documentId)
      .order('chunk_index', { ascending: true })
      .limit(TOP_K_CHUNKS)

    if (fallbackErr || !fallbackChunks || fallbackChunks.length === 0) {
      throw new Error(
        'No content found in this document. The document may not have been indexed correctly.'
      )
    }

    const contextChunks = fallbackChunks.map((c: { content: string }) => c.content)
    const { result, model } = await generateResearchReport(query, contextChunks, plan)
    return { result, model, chunksUsed: fallbackChunks.length }
  }

  // Step 3: Build context from retrieved chunks (sorted by similarity desc)
  const typedChunks = chunks as SimilarChunk[]
  const contextChunks = typedChunks.map((c) => c.content)

  // Step 4: Generate structured research report
  const { result, model } = await generateResearchReport(query, contextChunks, plan)

  return {
    result,
    model,
    chunksUsed: typedChunks.length,
  }
}

// ---- Document Indexing Pipeline ----

export async function indexDocument(
  documentId: string,
  userId: string,
  text: string
): Promise<number> {
  const supabase = createAdminSupabase()

  // Split text into overlapping chunks
  const chunks = chunkText(text)

  if (chunks.length === 0) {
    throw new Error('Document produced no text chunks after processing')
  }

  // Generate embeddings in batch (HuggingFace)
  const contents = chunks.map((c) => c.content)
  const embeddings = await generateEmbeddingsBatch(contents)

  if (embeddings.length !== chunks.length) {
    throw new Error(
      `Embedding mismatch: got ${embeddings.length} embeddings for ${chunks.length} chunks`
    )
  }

  // Build insert rows
  const rows = chunks.map((chunk, i) => ({
    document_id: documentId,
    user_id: userId,
    chunk_index: chunk.index,
    content: chunk.content,
    embedding: embeddings[i],
    token_count: chunk.tokenCount,
  }))

  // Insert in batches of 50 to avoid request size limits
  const BATCH_SIZE = 50
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from('document_chunks').insert(batch)
    if (error) {
      throw new Error(`Failed to insert chunk batch ${i / BATCH_SIZE}: ${error.message}`)
    }
  }

  return chunks.length
}
