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
    .maybeSingle()

  if (profile) return profile

  // Temporary error (network, timeout): do NOT create anything
  if (error) {
    console.error('Failed to load profile:', error.message)
    return null
  }

  // Row is truly missing — create it with the admin client, never overwrite an existing row
  const admin = createAdminSupabase()
  const { error: createErr } = await admin
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        plan: 'free',
        credits: 10,
        total_queries: 0,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )

  if (createErr) {
    console.error('Failed to create missing profile:', createErr.message)
    return null
  }

  const { data: created } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return created
}

export function createAdminSupabase() {
  return createAdminClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
