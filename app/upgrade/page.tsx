import DashLayout from '@/components/DashLayout'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import UpgradeView from '@/components/UpgradeView'

export const metadata = { title: 'Upgrade' }

export default async function Page() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')
  return (
    <DashLayout>
      <UpgradeView profile={profile} />
    </DashLayout>
  )
}
