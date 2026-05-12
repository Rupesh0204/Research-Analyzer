# ✏️ Files You Need to Change

Only **2 actions** are needed before running the project:

---

## Action 1: Fill in `.env.local`

Open `.env.local` and replace all placeholder values:

| Variable | Where to get it | Example value |
|----------|----------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | `eyJhbGci...` |
| `GEMINI_API_KEY` | aistudio.google.com/app/apikey | `AIzaSy...` |
| `HUGGINGFACE_API_KEY` | huggingface.co/settings/tokens | `hf_...` |
| `GROQ_API_KEY` | console.groq.com | `gsk_...` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay → Settings → API Keys | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay → Settings → API Keys | `abc123...` |

All keys are **FREE**. See `SETUP_GUIDE.md` for exact steps.

---

## Action 2: Run SQL in Supabase

1. Open your Supabase project
2. Go to **SQL Editor → New Query**
3. Paste the full contents of `supabase/SUPABASE_SETUP.sql`
4. Click **Run**

That's it. Nothing else needs to be changed.

---

## Then run:

```bash
npm install
npm run dev
```

Open **http://localhost:3000** 🎉
