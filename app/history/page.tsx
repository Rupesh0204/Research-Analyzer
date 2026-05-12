import DashLayout from '@/components/DashLayout'
import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HistoryView from '@/components/HistoryView'

export const metadata = { title: 'History' }

export default async function Page() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: queries } = await supabase
    .from('research_queries')
    .select('id,query,result,status,error_message,model_used,processing_time_ms,created_at,documents(title)')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100)
  return (
    <DashLayout>
      <HistoryView queries={queries || []} />
    </DashLayout>
  )
}
