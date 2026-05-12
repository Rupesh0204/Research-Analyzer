import DashLayout from '@/components/DashLayout'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsView from '@/components/SettingsView'

export const metadata = { title: 'Settings' }

export default async function Page() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [{ data: profile }, { data: transactions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
  ])
  if (!profile) redirect('/login')
  return (
    <DashLayout>
      <SettingsView profile={profile} transactions={transactions || []} />
    </DashLayout>
  )
}
