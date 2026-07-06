import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClientBase } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function getOrCreateProfile(
  supabase: ReturnType<typeof createServerSupabase>,
  user: { id: string; email?: string | null; user_metadata?: any }
) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!error && profile) return profile

  // Profile row missing (e.g. account existed before the DB trigger was set up) — create it now.
  const { data: created, error: createErr } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email ?? '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      plan: 'free',
      credits: 10,
      total_queries: 0,
    })
    .select()
    .single()

  if (createErr) {
    console.error('Failed to create missing profile:', createErr.message)
    return null
  }

  return created
}

export function createAdminSupabase() {
  return createAdminClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
