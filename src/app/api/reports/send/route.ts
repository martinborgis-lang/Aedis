import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmail, emailTemplate } from '@/lib/email'

export async function POST(request: Request) {
  const { reportId, projectId, projectName, recipients } =
    await request.json()

  const supabase = createServerSupabaseClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  let sent = 0

  for (const recipient of recipients) {
    const trackingToken = crypto.randomUUID()

    await supabase.from('report_recipients').insert({
      report_id: reportId,
      project_id: projectId,
      recipient_email: recipient.email,
      recipient_name: recipient.name,
      tracking_token: trackingToken,
      sent_at: new Date().toISOString()
    })

    const html = emailTemplate(`
      <p style="color:#6E6E73;font-size:15px;margin:0 0 16px">
        Bonjour ${recipient.name},
      </p>
      <p style="color:#0E0E0F;font-size:17px;font-weight:500;margin:0 0 12px">
        Rapport de chantier disponible
      </p>
      <p style="color:#6E6E73;font-size:15px;line-height:1.6;margin:0 0 20px">
        Un nouveau rapport est disponible pour le projet
        <strong style="color:#0E0E0F">"${projectName}"</strong>.
        Vous le trouverez en pièce jointe.
      </p>
      <img src="${appUrl}/api/reports/track/${trackingToken}"
           width="1" height="1" style="display:none" alt="" />
    `)

    const ok = await sendEmail({
      to: [{ email: recipient.email, name: recipient.name }],
      subject: `Rapport chantier — ${projectName}`,
      htmlContent: html
    })

    if (ok) {
      sent++
      await supabase.from('reports')
        .update({ sent_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', reportId)
    }
  }

  return Response.json({ sent, total: recipients.length })
}