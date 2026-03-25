import { createClient } from '@supabase/supabase-js'
import { sendEmail, taskOverdueEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const today = new Date().toISOString().split('T')[0]

  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*, projects(name)')
    .lt('end_date', today)
    .neq('status', 'completed')

  let sent = 0
  for (const task of (overdueTasks || [])) {
    const { data: token } = await supabase
      .from('artisan_tokens')
      .select('*')
      .eq('task_id', task.id)
      .not('artisan_email', 'is', null)
      .single()

    if (!token?.artisan_email) continue

    // Check not already sent today
    const { data: existing } = await supabase
      .from('reminders')
      .select('id')
      .eq('task_id', task.id)
      .eq('type', 'task_overdue')
      .gte('created_at', today)
      .maybeSingle()

    if (existing) continue

    const artisanUrl = `${process.env.NEXT_PUBLIC_APP_URL}/artisan/${token.token}`
    const html = taskOverdueEmail(
      token.artisan_name,
      task.name,
      (task as any).projects?.name || 'Votre chantier',
      artisanUrl
    )

    const ok = await sendEmail({
      to: [{ email: token.artisan_email, name: token.artisan_name }],
      subject: `⚠ Retard — ${task.name}`,
      htmlContent: html
    })

    await supabase.from('reminders').insert({
      project_id: task.project_id,
      task_id: task.id,
      type: 'task_overdue',
      recipient_email: token.artisan_email,
      recipient_name: token.artisan_name,
      status: ok ? 'sent' : 'failed',
      sent_at: ok ? new Date().toISOString() : null
    })

    if (ok) sent++
  }

  return Response.json({ sent, total: overdueTasks?.length || 0 })
}