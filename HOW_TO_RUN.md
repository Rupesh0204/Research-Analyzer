# ✅ How to Run This Project

## What Was Fixed
- Removed duplicate `app/(dashboard)/` route group (caused build crash)
- Removed all per-section `layout.tsx` files (conflicted with each other)
- Fixed `createClient()` → `createServerSupabase()` in all files
- Fixed `reset-password` page import error
- Removed stray `{app,lib/` directory
- Added `DashLayout` component (single auth+sidebar wrapper used by all pages)

## Setup (5 Steps)

### 1. Install
```bash
npm install
```

### 2. Your API Keys — Already in `.env.local`
Your Supabase, Gemini, Groq, HuggingFace, and Razorpay keys are already filled in.
Just verify the file is named `.env.local` (not `.env.local.txt`).

### 3. Run SQL in Supabase
- Go to your Supabase project → SQL Editor → New Query
- Paste the entire contents of `supabase/SUPABASE_SETUP.sql`
- Click **Run**

If SQL already ran before, skip this step.

### 4. Run the App
```bash
npm run dev
```

### 5. Open
```
http://localhost:3000
```

## Project Structure (Clean)
```
app/
  layout.tsx              ← ONE root layout only
  page.tsx                ← Landing (/)
  login/page.tsx          ← /login
  signup/page.tsx         ← /signup
  reset-password/page.tsx ← /reset-password
  dashboard/page.tsx      ← /dashboard ✓
  documents/page.tsx      ← /documents ✓
  history/page.tsx        ← /history ✓
  settings/page.tsx       ← /settings ✓
  upgrade/page.tsx        ← /upgrade ✓
  api/                    ← All API routes ✓

components/
  DashLayout.tsx          ← Auth + Sidebar wrapper
  DashSidebar.tsx         ← Navigation sidebar
  DocumentsPage.tsx       ← Upload + Research UI
  ResearchPanel.tsx       ← AI query interface
  HistoryView.tsx         ← Query history
  SettingsView.tsx        ← Account settings
  UpgradeView.tsx         ← Razorpay payment

lib/
  supabase/server.ts      ← createServerSupabase(), createAdminSupabase()
  supabase/client.ts      ← supabase (browser client)
  ai/                     ← RAG pipeline, LLM, embeddings, chunker
```

## Test Payment
- Card: `4111 1111 1111 1111`
- Expiry: any future date
- CVV: any 3 digits
- OTP: `1234`
