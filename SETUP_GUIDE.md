# 📖 Complete Setup Guide

Follow these steps in order. Each step takes 2–5 minutes.

---

## STEP 1 — Get the Code Running

```bash
npm install
```

---

## STEP 2 — Create a Supabase Project

1. Go to **https://supabase.com** → Sign up (free)
2. Click **"New Project"**
   - Name: `ai-research-saas`
   - Database Password: save this somewhere safe
   - Region: Choose closest to you (`ap-south-1` for India)
3. Wait ~2 minutes for the project to spin up

### Get your keys:
- Go to: **Project Settings → API**
- Copy these 3 values into `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL        = https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = eyJhbGci... (starts with eyJ)
SUPABASE_SERVICE_ROLE_KEY       = eyJhbGci... (starts with eyJ, keep secret)
```

---

## STEP 3 — Run the Database Setup SQL

1. In your Supabase project → go to **SQL Editor**
2. Click **"New Query"**
3. Open the file: `supabase/SUPABASE_SETUP.sql`
4. **Select All** → paste into SQL Editor
5. Click **"Run"** (green button)

✅ You should see: "Success. No rows returned"

### What this creates:
- `profiles` table — user accounts with plan & credits
- `documents` table — uploaded research documents
- `document_chunks` table — text chunks with vector embeddings
- `research_queries` table — query history and results
- `transactions` table — payment records
- `match_document_chunks()` function — pgvector similarity search
- All Row Level Security policies
- Auto-create profile trigger on signup

---

## STEP 4 — Get Google Gemini API Key (FREE)

1. Go to: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"** → "Create API key in new project"
4. Copy the key → add to `.env.local`:

```
GEMINI_API_KEY = AIzaSy...
```

**Free tier limits:** 15 requests/minute · 1,000,000 tokens/day

---

## STEP 5 — Get HuggingFace Token (FREE)

Used to generate text embeddings for semantic search.

1. Go to: **https://huggingface.co/settings/tokens**
2. Sign up / log in → Click **"New token"**
3. Name: `research-ai` · Type: **Read**
4. Copy → add to `.env.local`:

```
HUGGINGFACE_API_KEY = hf_...
```

**Free tier limits:** 30,000 requests/month

> **Note:** First embedding request is slow (~20 seconds) because the model loads. Subsequent requests are fast (~2-3 seconds).

---

## STEP 6 — Get Groq API Key (FREE — Optional Fallback)

Used automatically if Gemini fails or hits rate limits.

1. Go to: **https://console.groq.com**
2. Sign up → **API Keys → Create key**
3. Copy → add to `.env.local`:

```
GROQ_API_KEY = gsk_...
```

**Free tier:** 14,400 requests/day

---

## STEP 7 — Get Razorpay Test Keys (FREE)

1. Go to: **https://razorpay.com** → Sign up
2. Go to: **Settings → API Keys**
3. Click **"Generate Test Keys"** (make sure you're in TEST mode)
4. Copy both keys → add to `.env.local`:

```
NEXT_PUBLIC_RAZORPAY_KEY_ID = rzp_test_...
RAZORPAY_KEY_SECRET         = your_secret_here
```

---

## STEP 8 — Configure .env.local

Open `.env.local` in the project root. It already has the template.
Fill in ALL the values you collected above.

Your final `.env.local` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

GEMINI_API_KEY=AIzaSyABC123...

GROQ_API_KEY=gsk_ABC123...

HUGGINGFACE_API_KEY=hf_ABC123...

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_ABC123
RAZORPAY_KEY_SECRET=secretABC123

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PREMIUM_PRICE_PAISE=100
ADMIN_SECRET=any_random_string_here
```

---

## STEP 9 — Run the App

```bash
npm run dev
```

Open: **http://localhost:3000**

---

## STEP 10 — Test the Full Flow

### A) Sign Up
- Go to `/signup`
- Create account with any email/password
- You'll get **10 free credits**
- Verify in Supabase → Table Editor → `profiles` — your row should appear

### B) Upload a Document
- Go to `/documents`
- Upload the included test file: `test-documents/sample-research-paper.txt`
- Processing takes ~20-30 seconds (embeddings generation)
- Status changes from **Processing** → **Ready**

### C) Run a Research Query
- Click on your ready document
- Type a question (min 10 chars):
  ```
  What is the impact of LLMs on research productivity?
  ```
- Click **Generate Research Report**
- You'll see: Topic, Summary, Key Points, Insights, Citations, Confidence %

### D) Test Premium Upgrade
- Go to `/upgrade`
- Click **"Upgrade Now"**
- Razorpay test checkout opens
- Use test card:
  - Card number: `4111 1111 1111 1111`
  - Expiry: `12/26`
  - CVV: `123`
  - OTP: `1234`
- Your plan upgrades to Premium, credits → 50

### E) Export a Report
- Go to `/history`
- Expand any completed query
- Click **Export ↓ → .TXT** or **.JSON**

---

## Troubleshooting

### "No relevant content found"
The query didn't match any document chunks. Try:
- A more specific question related to document content
- Check that document status is `ready` (green dot)
- The similarity threshold may be too high — this is normal for very short queries

### HuggingFace API slow / timeout
First request loads the model (~20s). This is normal.
If it keeps timing out, your HF token may be invalid — regenerate it.

### Gemini API error: 429 Too Many Requests
You've hit the free tier rate limit (15 req/min).
Wait 1 minute and try again. Groq fallback will activate automatically.

### Razorpay checkout doesn't open
- Make sure keys start with `rzp_test_` (not `rzp_live_`)
- Check browser console for errors
- Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` is set correctly

### "Profile not found" error
The profile trigger didn't fire. Fix manually:
1. Go to Supabase → SQL Editor
2. Run:
```sql
INSERT INTO public.profiles (id, email, plan, credits)
SELECT id, email, 'free', 10 FROM auth.users WHERE id = auth.uid();
```

### Build errors: "Cannot find module 'canvas'"
This is expected for pdf-parse. The `next.config.js` already handles this with:
```js
config.resolve.alias['canvas'] = false
```
If you still see it, run `npm install` again.

---

## Deploy to Vercel (Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# When prompted, add all environment variables
# OR go to Vercel Dashboard → Project → Settings → Environment Variables
```

After deploying, update:
```env
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

For Razorpay webhooks, add this URL in Razorpay Dashboard:
```
https://your-project.vercel.app/api/webhook
```

---

## Files You Need to Modify

Only these files need your attention:

| File | What to change |
|------|---------------|
| `.env.local` | Fill in all API keys |
| `supabase/SUPABASE_SETUP.sql` | Run in Supabase SQL Editor (no edits needed) |

Everything else is ready to go.

