export async function sendEmail(options: {
  to: { email: string; name: string }[]
  subject: string
  htmlContent: string
}): Promise<boolean> {
  if (!process.env.BREVO_API_KEY) {
    console.warn('BREVO_API_KEY not configured')
    return false
  }
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Aedis', email: 'noreply@aedis.app' },
        ...options
      })
    })
    return response.ok
  } catch { return false }
}

export function emailTemplate(content: string, ctaText?: string, ctaUrl?: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
  <body style="margin:0;padding:0;background:#F5F4F0;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #E5E4E0">
    <div style="background:#E8650A;padding:24px 32px">
      <span style="color:#fff;font-size:20px;font-weight:600">Aedis</span>
    </div>
    <div style="padding:32px">
      ${content}
      ${ctaText && ctaUrl ? `<div style="margin-top:28px">
        <a href="${ctaUrl}" style="background:#E8650A;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:500">${ctaText}</a>
      </div>` : ''}
    </div>
    <div style="padding:20px 32px;border-top:1px solid #E5E4E0;color:#6E6E73;font-size:12px">
      Aedis — Plateforme de suivi de chantier
    </div>
  </div></body></html>`
}

export function taskOverdueEmail(artisanName: string, taskName: string, projectName: string, artisanUrl: string) {
  return emailTemplate(`
    <p style="color:#6E6E73;font-size:15px;margin:0 0 16px">Bonjour ${artisanName},</p>
    <p style="color:#0E0E0F;font-size:17px;font-weight:500;margin:0 0 12px">Une tâche est en retard</p>
    <p style="color:#6E6E73;font-size:15px;line-height:1.6;margin:0 0 20px">
      La tâche <strong>"${taskName}"</strong> sur le chantier
      <strong>"${projectName}"</strong> aurait dû être terminée.
      Merci de mettre à jour l'avancement.
    </p>
  `, 'Mettre à jour ma tâche', artisanUrl)
}

export function reserveAssignedEmail(artisanName: string, reserveTitle: string, priority: string, projectName: string, artisanUrl: string) {
  const priorityLabel = priority === 'high' ? '🔴 Haute' : priority === 'medium' ? '🟡 Moyenne' : '🟢 Basse'
  return emailTemplate(`
    <p style="color:#6E6E73;font-size:15px;margin:0 0 16px">Bonjour ${artisanName},</p>
    <p style="color:#0E0E0F;font-size:17px;font-weight:500;margin:0 0 12px">Nouvelle réserve à traiter</p>
    <div style="background:#F5F4F0;border-radius:8px;padding:16px;margin:0 0 20px">
      <p style="margin:0 0 4px;font-weight:500">${reserveTitle}</p>
      <p style="margin:0;color:#6E6E73;font-size:13px">Priorité : ${priorityLabel}</p>
    </div>
    <p style="color:#6E6E73;font-size:14px">Chantier : <strong>${projectName}</strong></p>
  `, 'Voir et résoudre', artisanUrl)
}