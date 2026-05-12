# 🧠 AI Research Assistant SaaS

A production-grade AI SaaS application built with **Next.js 14**, **Supabase**, and **Google Gemini**.

Upload documents → Ask research questions → Get structured AI reports with citations.

---

## 🚀 Quick Start (5 steps)

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template
cp .env.local .env.local.real   # rename to .env.local after filling

# 3. Fill in .env.local with your API keys (see SETUP_GUIDE.md)

# 4. Run the SQL in supabase/SUPABASE_SETUP.sql in your Supabase SQL Editor

# 5. Start the app
npm run dev
```

Open → **http://localhost:3000**

---

## 📁 Project Structure

```
ai-research-saas/
│
├── 📄 .env.local                     ← YOUR API KEYS GO HERE
├── 📄 SETUP_GUIDE.md                 ← Step-by-step setup instructions
│
├── supabase/
│   └── SUPABASE_SETUP.sql            ← Run this once in Supabase SQL Editor
│
├── app/
│   ├── page.tsx                      ← Landing page (/)
│   ├── login/page.tsx                ← Sign in (/login)
│   ├── signup/page.tsx               ← Register (/signup)
│   ├── reset-password/page.tsx       ← Password reset (/reset-password)
│   ├── auth/callback/route.ts        ← Supabase email redirect handler
│   │
│   ├── (dashboard)/                  ← Protected pages (require login)
│   │   ├── layout.tsx                ← Shared sidebar + auth check
│   │   ├── dashboard/page.tsx        ← Home dashboard (/dashboard)
│   │   ├── documents/                ← Upload + research (/documents)
│   │   ├── history/                  ← Query history (/history)
│   │   ├── settings/                 ← Account settings (/settings)
│   │   └── upgrade/                  ← Premium plan (/upgrade)
│   │
│   └── api/
│       ├── documents/upload/         ← POST: upload & index a document
│       ├── documents/list/           ← GET: list docs  DELETE: remove doc
│       ├── queries/generate/         ← POST: run RAG pipeline
│       ├── queries/history/          ← GET: past queries
│       ├── queries/export/           ← GET: download report (.json/.txt)
│       ├── payment/create-order/     ← POST: create Razorpay order
│       ├── payment/verify/           ← POST: verify payment + upgrade
│       ├── user/profile/             ← GET/PATCH/DELETE: profile
│       ├── webhook/                  ← POST: Razorpay webhook
│       └── admin/reset-credits/      ← POST: dev-only credit reset
│
├── components/dashboard/
│   ├── Sidebar.tsx                   ← Navigation sidebar
│   └── ResearchPanel.tsx             ← Query input + result display
│
├── lib/
│   ├── ai/
│   │   ├── embeddings.ts             ← HuggingFace API (384-dim vectors)
│   │   ├── chunker.ts                ← Split text into overlapping chunks
│   │   ├── document-processor.ts    ← Extract text from PDF/TXT/MD
│   │   ├── llm.ts                    ← Gemini + Groq API calls
│   │   └── rag-pipeline.ts           ← Full RAG orchestration
│   └── supabase/
│       ├── client.ts                 ← Browser Supabase client
│       ├── server.ts                 ← Server + Admin Supabase clients
│       └── middleware.ts             ← Auth session management
│
├── types/index.ts                    ← All TypeScript types
├── hooks/useProfile.ts               ← Client-side profile hook
└── middleware.ts                     ← Route protection
```

---

## 🔑 API Keys Needed (all FREE)

| Service | Purpose | Get it at |
|---------|---------|-----------|
| Supabase | Database + Auth | supabase.com |
| Google Gemini | LLM (AI reports) | aistudio.google.com/app/apikey |
| HuggingFace | Text embeddings | huggingface.co/settings/tokens |
| Groq | LLM fallback | console.groq.com |
| Razorpay | Test payments | razorpay.com |

---

## 🏗 How RAG Works

```
User Query
    ↓
Generate query embedding (HuggingFace all-MiniLM-L6-v2)
    ↓
pgvector similarity search → top-5 relevant chunks
    ↓
Build context prompt with retrieved chunks
    ↓
Gemini 1.5 Flash/Pro generates structured JSON report
    ↓
Return: topic, summary, key points, insights, citations, confidence score
```

---

## 💳 Test Payment

Use these Razorpay test credentials:
- **Card**: `4111 1111 1111 1111`
- **Expiry**: Any future date
- **CVV**: Any 3 digits  
- **OTP**: `1234`

---

## 🚢 Deploy to Vercel

```bash
npx vercel
# Add all environment variables in Vercel dashboard
```
