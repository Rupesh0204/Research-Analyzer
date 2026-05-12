// ============================================================
// All TypeScript types for the AI Research Assistant SaaS
// ============================================================

export type UserPlan = 'free' | 'premium'

// ---- Database Row Types ----

export interface Profile {
  id: string
  email: string
  full_name: string | null
  plan: UserPlan
  credits: number
  total_queries: number
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  original_filename: string
  file_type: 'pdf' | 'txt' | 'md'
  file_size: number
  storage_path: string | null
  raw_text: string | null
  chunk_count: number
  status: 'processing' | 'ready' | 'error'
  created_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  user_id: string
  chunk_index: number
  content: string
  embedding: number[] | null
  token_count: number | null
  created_at: string
}

export interface ResearchQuery {
  id: string
  user_id: string
  document_id: string | null
  query: string
  result: ResearchResult | null
  credits_used: number
  model_used: string | null
  processing_time_ms: number | null
  status: 'pending' | 'processing' | 'completed' | 'error'
  error_message: string | null
  created_at: string
  // joined
  documents?: { title: string; original_filename: string } | null
}

export interface Transaction {
  id: string
  user_id: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  razorpay_signature: string | null
  amount: number
  currency: string
  status: 'created' | 'paid' | 'failed' | 'refunded'
  plan_upgraded_to: string | null
  credits_added: number
  created_at: string
  updated_at: string
}

// ---- AI / RAG Types ----

export interface ResearchResult {
  topic: string
  summary: string
  key_points: string[]
  insights: string[]
  citations: Citation[]
  confidence_score: number
  methodology?: string
  limitations?: string
}

export interface Citation {
  text: string
  source: string
  chunk_id?: string
  relevance_score?: number
}

export interface TextChunk {
  content: string
  index: number
  tokenCount: number
}

export interface SimilarChunk {
  id: string
  document_id: string
  content: string
  similarity: number
}

// ---- API Request/Response Types ----

export interface UploadResponse {
  document: Document
  message: string
}

export interface GenerateRequest {
  query: string
  document_id: string
}

export interface GenerateResponse {
  query_id: string
  result: ResearchResult
  credits_remaining: number
  processing_time_ms: number
  model_used: string
  chunks_analyzed: number
}

export interface CreateOrderResponse {
  order_id: string
  amount: number
  currency: string
  key_id: string
}

export interface VerifyPaymentRequest {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export interface VerifyPaymentResponse {
  success: boolean
  message: string
  plan: UserPlan
  credits: number
}

// ---- Plan Configuration ----

export const PLAN_LIMITS = {
  free: {
    credits: 10,
    max_documents: 1,
    max_file_size_mb: 5,
    model: 'gemini-1.5-flash',
    label: 'Free',
  },
  premium: {
    credits: 50,
    max_documents: 3,
    max_file_size_mb: 20,
    model: 'gemini-1.5-pro',
    label: 'Premium',
  },
} as const

export const CREDITS_PER_QUERY = 1

export const RAZORPAY_PREMIUM_AMOUNT_PAISE =
  parseInt(process.env.NEXT_PUBLIC_PREMIUM_PRICE_PAISE || '100')
