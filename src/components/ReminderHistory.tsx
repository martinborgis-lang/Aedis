'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ReminderHistory({ projectId }: { projectId: string }) {
  const [reminders, setReminders] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    supabase.from('reminders').select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setReminders(data || []))
  }, [projectId, supabase])

  if (reminders.length === 0) return (
    <p className="text-sm text-gray-400 text-center py-8">
      Aucun email envoyé sur ce projet
    </p>
  )

  return (
    <div className="space-y-2">
      {reminders.map(r => (
        <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
          <span className={`text-xs px-2 py-1 rounded-full ${
            r.type === 'task_overdue'
              ? 'bg-red-50 text-red-700'
              : 'bg-orange-50 text-orange-700'
          }`}>
            {r.type === 'task_overdue' ? 'Retard' : 'Réserve'}
          </span>
          <span className="text-sm text-gray-700 flex-1">{r.recipient_name} ({r.recipient_email})</span>
          <span className={`text-xs ${r.status === 'sent' ? 'text-green-600' : 'text-red-500'}`}>
            {r.status === 'sent' ? '✓ Envoyé' : '✗ Échec'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(r.created_at).toLocaleDateString('fr-FR')}
          </span>
        </div>
      ))}
    </div>
  )
}