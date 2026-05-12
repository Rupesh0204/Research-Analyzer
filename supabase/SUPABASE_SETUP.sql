-- ================================================================
-- AI RESEARCH SAAS — Complete Supabase Database Setup
-- ================================================================
-- HOW TO USE:
--   1. Open your Supabase project
--   2. Go to SQL Editor → New Query
--   3. Paste this ENTIRE file
--   4. Click RUN
--   5. Done ✓
-- ================================================================

-- Step 1: Enable pgvector extension (REQUIRED for semantic search)
CREATE EXTENSION IF NOT EXISTS vector;

-- ================================================================
-- TABLES
-- ================================================================

-- Users / Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email         TEXT        NOT NULL,
  full_name     TEXT,
  plan          TEXT        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  credits       INTEGER     NOT NULL DEFAULT 10,
  total_queries INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents uploaded by users
CREATE TABLE IF NOT EXISTS public.documents (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title             TEXT        NOT NULL,
  original_filename TEXT        NOT NULL,
  file_type         TEXT        NOT NULL CHECK (file_type IN ('pdf', 'txt', 'md')),
  file_size         INTEGER     NOT NULL DEFAULT 0,
  storage_path      TEXT,
  raw_text          TEXT,
  chunk_count       INTEGER     NOT NULL DEFAULT 0,
  status            TEXT        NOT NULL DEFAULT 'processing'
                                CHECK (status IN ('processing', 'ready', 'error')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Text chunks with vector embeddings (RAG core)
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id   UUID        REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
  user_id       UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  chunk_index   INTEGER     NOT NULL,
  content       TEXT        NOT NULL,
  embedding     vector(384),           -- all-MiniLM-L6-v2 = 384 dims
  token_count   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Research queries and results
CREATE TABLE IF NOT EXISTS public.research_queries (
  id                 UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_id        UUID        REFERENCES public.documents(id) ON DELETE SET NULL,
  query              TEXT        NOT NULL,
  result             JSONB,
  credits_used       INTEGER     NOT NULL DEFAULT 1,
  model_used         TEXT,
  processing_time_ms INTEGER,
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  razorpay_order_id   TEXT        UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  amount              INTEGER     NOT NULL DEFAULT 0,
  currency            TEXT        NOT NULL DEFAULT 'INR',
  status              TEXT        NOT NULL DEFAULT 'created'
                                  CHECK (status IN ('created', 'paid', 'failed', 'refunded')),
  plan_upgraded_to    TEXT,
  credits_added       INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- INDEXES (for performance)
-- ================================================================

-- pgvector index for similarity search (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON public.document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Regular indexes
CREATE INDEX IF NOT EXISTS idx_chunks_user    ON public.document_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_chunks_doc     ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_docs_user      ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_user   ON public.research_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_status ON public.research_queries(status);
CREATE INDEX IF NOT EXISTS idx_transactions_order ON public.transactions(razorpay_order_id);

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions     ENABLE ROW LEVEL SECURITY;

-- profiles: each user sees only their own row
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- documents: CRUD on own documents
CREATE POLICY "docs_select_own"  ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "docs_insert_own"  ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "docs_update_own"  ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "docs_delete_own"  ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- document_chunks: users access only their own chunks
CREATE POLICY "chunks_select_own" ON public.document_chunks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "chunks_insert_own" ON public.document_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chunks_delete_own" ON public.document_chunks FOR DELETE USING (auth.uid() = user_id);

-- research_queries: CRUD own queries
CREATE POLICY "queries_select_own" ON public.research_queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "queries_insert_own" ON public.research_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "queries_update_own" ON public.research_queries FOR UPDATE USING (auth.uid() = user_id);

-- transactions: users can only view their own
CREATE POLICY "tx_select_own" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Auto-create profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'free',
    10
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: runs after every new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- Called from: lib/ai/rag-pipeline.ts → runRAGPipeline()
-- ================================================================
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding   vector(384),
  match_user_id     UUID,
  match_document_id UUID    DEFAULT NULL,
  match_threshold   FLOAT   DEFAULT 0.25,
  match_count       INT     DEFAULT 5
)
RETURNS TABLE (
  id          UUID,
  document_id UUID,
  content     TEXT,
  similarity  FLOAT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE
    dc.user_id = match_user_id
    AND (match_document_id IS NULL OR dc.document_id = match_document_id)
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ================================================================
-- STORAGE BUCKET (for file uploads — optional)
-- ================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  20971520,
  ARRAY['application/pdf', 'text/plain', 'text/markdown']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'objects' AND policyname = 'storage_upload_own'
  ) THEN
    CREATE POLICY "storage_upload_own" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    CREATE POLICY "storage_select_own" ON storage.objects
      FOR SELECT USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
    CREATE POLICY "storage_delete_own" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'documents'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ================================================================
-- VERIFICATION QUERIES
-- Run these after setup to confirm everything is working
-- ================================================================

-- Check tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check pgvector is enabled:
-- SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check the trigger exists:
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'users';

-- ================================================================
-- DONE! Your Supabase database is ready.
-- Next: Fill in .env.local with your Supabase URL and keys.
-- ================================================================
