import DashLayout from '@/components/DashLayout'
import { createServerSupabase, getOrCreateProfile } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DocumentsPage from '@/components/DocumentsPage'

export const metadata = { title: 'Documents' }

export default async function Page() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const [profile, { data: docs }] = await Promise.all([
    getOrCreateProfile(supabase, user),
    supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])
  if (!profile) redirect('/login')
  return (
    <DashLayout>
      <DocumentsPage profile={profile} initialDocs={docs || []} maxDocs={profile.plan === 'premium' ? 3 : 1} />
    </DashLayout>
  )
}
