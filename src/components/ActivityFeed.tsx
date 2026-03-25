'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const ICONS: Record<string, string> = {
  photo_uploaded: '📸',
  task_completed: '✓',
  reserve_opened: '⚠',
  reserve_resolved: '✓',
  document_uploaded: '📁'
}

const COLORS: Record<string, string> = {
  task_completed: 'text-green-600',
  reserve_resolved: 'text-green-600',
  reserve_opened: 'text-orange-500',
  photo_uploaded: 'text-blue-500',
  document_uploaded: 'text-purple-500'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

export default function ActivityFeed({ projectIds }: { projectIds: string[] }) {
  const [activities, setActivities] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!projectIds.length) return
    supabase
      .from('activity_feed')
      .select('*')
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })
      .limit(15)
      .then(({ data }) => setActivities(data || []))
  }, [projectIds.join(','), supabase])

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
        Activité récente
      </h3>
      <div className="space-y-4">
        {activities.map(a => (
          <div key={a.id} className="flex gap-3 items-start">
            <span className={`text-sm mt-0.5 ${COLORS[a.type] || 'text-gray-400'}`}>
              {ICONS[a.type] || '•'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 leading-snug">{a.description}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-gray-400 truncate">{a.project_name}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400 shrink-0">{timeAgo(a.created_at)}</span>
              </div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-6">
            Aucune activité récente
          </p>
        )}
      </div>
    </div>
  )
}