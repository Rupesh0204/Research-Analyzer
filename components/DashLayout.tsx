import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashSidebar from '@/components/DashSidebar'

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let profile = data

  if (error || !profile) {
    const { data: created } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        plan: 'free',
        credits: 10,
        total_queries: 0,
      })
      .select()
      .single()
    profile = created
  }

  if (!profile) redirect('/login')

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f0f11',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <DashSidebar profile={profile} />
      <main style={{ flex: 1, overflow: 'auto', minWidth: 0, color: '#f1f1f3' }}>
        {children}
      </main>
    </div>
  )
}
