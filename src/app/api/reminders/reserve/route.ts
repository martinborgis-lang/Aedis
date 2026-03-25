import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmail, reserveAssignedEmail } from '@/lib/email'

export async function POST(request: Request) {
  const { reserveId, projectId } = await request.json()
  const supabase = createServerSupabaseClient()

  const { data: reserve } = await supabase
    .from('reserves')
    .select('*, projects(name)')
    .eq('id', reserveId)
    .single()

  if (!reserve) return Response.json({ error: 'Reserve not found' }, { status: 404 })

  // Find artisan token with email
  const { data: artisanTokens } = await supabase
    .from('artisan_tokens')
    .select('*')
    .eq('project_id', projectId)

  // Match by assigned_to UUID or find any token with email
  const token = artisanTokens?.find(t => t.artisan_email)
  if (!token?.artisan_email) return Response.json({ skipped: 'no email' })

  const artisanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/artisan/${token.token}`
  const html = reserveAssignedEmail(
    token.artisan_name,
    reserve.title,
    reserve.priority,
    (reserve as any).projects?.name || 'Votre chantier',
    artisanUrl
  )

  const ok = await sendEmail({
    to: [{ email: token.artisan_email, name: token.artisan_name }],
    subject: `Nouvelle réserve — ${reserve.title}`,
    htmlContent: html
  })

  await supabase.from('reminders').insert({
    project_id: projectId,
    reserve_id: reserveId,
    type: 'reserve_assigned',
    recipient_email: token.artisan_email,
    recipient_name: token.artisan_name,
    status: ok ? 'sent' : 'failed',
    sent_at: ok ? new Date().toISOString() : null,
    subject: `Nouvelle réserve — ${reserve.title}`
  })

  return Response.json({ sent: ok })
}