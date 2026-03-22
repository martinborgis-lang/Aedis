'use client'

import { useMemo } from 'react'
import { ImportLot } from '@/lib/import/types'
import { calculateAllDates } from '@/lib/import/calculateDates'

interface ImportMiniGanttProps {
  lots: ImportLot[]
  startDate: Date
}

export default function ImportMiniGantt({ lots, startDate }: ImportMiniGanttProps) {
  const ganttData = useMemo(() => {
    if (!lots.length) return { bars: [], totalDays: 0, startDate, endDate: startDate }

    const dateRanges = calculateAllDates(lots, startDate)
    const allDates = Array.from(dateRanges.values()).flatMap(range => [range.start, range.end])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

    const bars = lots.map(lot => {
      const range = dateRanges.get(lot.number)
      if (!range) return null

      const startOffset = Math.floor((range.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
      const duration = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      const width = (duration / totalDays) * 100
      const left = (startOffset / totalDays) * 100

      const color = lot.duration_source === 'ai_estimate' ? 'bg-orange-500' : 'bg-green-500'

      return {
        lot,
        left,
        width,
        color,
        range
      }
    }).filter(Boolean)

    return {
      bars: bars as NonNullable<typeof bars[0]>[],
      totalDays,
      startDate: minDate,
      endDate: maxDate
    }
  }, [lots, startDate])

  const months = useMemo(() => {
    if (!ganttData.bars.length) return [];

    const monthsList = []
    const current = new Date(ganttData.startDate.getFullYear(), ganttData.startDate.getMonth(), 1)
    const end = new Date(ganttData.endDate.getFullYear(), ganttData.endDate.getMonth() + 1, 0)

    while (current <= end) {
      const monthStart = new Date(current)
      const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0)

      const startOffset = Math.max(0, Math.floor((monthStart.getTime() - ganttData.startDate.getTime()) / (1000 * 60 * 60 * 24)))
      const endOffset = Math.min(ganttData.totalDays, Math.ceil((monthEnd.getTime() - ganttData.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1)

      if (endOffset > startOffset) {
        const left = (startOffset / ganttData.totalDays) * 100
        const width = ((endOffset - startOffset) / ganttData.totalDays) * 100

        monthsList.push({
          label: current.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
          left,
          width
        })
      }

      current.setMonth(current.getMonth() + 1)
    }

    return monthsList
  }, [ganttData])

  if (!ganttData.bars.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Aucun lot à afficher</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Timeline des mois */}
      <div className="relative h-6 border-b border-gray-200">
        {months.map((month, index) => (
          <div
            key={index}
            className="absolute top-0 h-full flex items-center justify-center text-xs font-medium text-gray-600 border-r border-gray-100"
            style={{
              left: `${month.left}%`,
              width: `${month.width}%`
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* Barres des lots */}
      <div className="space-y-2">
        {ganttData.bars.map(({ lot, left, width, color, range }) => (
          <div key={lot.number} className="flex items-center gap-3">
            <div className="w-32 text-sm font-medium text-right text-gray-700 truncate">
              Lot {lot.number}
            </div>
            <div className="flex-1 relative h-6 bg-gray-100 rounded">
              <div
                className={`absolute top-0 h-full rounded flex items-center justify-center text-white text-xs font-medium ${color}`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`
                }}
              >
                {width > 15 && `${lot.duration_days}j`}
              </div>
              {/* Tooltip au hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {lot.name} • {lot.duration_days}j • {range.start.toLocaleDateString('fr-FR')} - {range.end.toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
            <div className="w-20 text-xs text-gray-500">
              {lot.duration_days} jours
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Durées du document</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="text-gray-600">Estimations IA</span>
        </div>
      </div>
    </div>
  )
}