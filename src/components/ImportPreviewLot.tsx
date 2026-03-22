'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Plus, Zap, FileText } from 'lucide-react'
import { ImportLot, ImportTask } from '@/lib/import/types'

interface ImportPreviewLotProps {
  lot: ImportLot
  allLots: ImportLot[]
  onChange: (updatedLot: ImportLot) => void
}

export default function ImportPreviewLot({ lot, allLots, onChange }: ImportPreviewLotProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState<{ [key: string]: boolean }>({})

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFieldChange = (field: keyof ImportLot, value: any) => {
    onChange({ ...lot, [field]: value })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTaskChange = (taskIndex: number, field: keyof ImportTask, value: any) => {
    const updatedTasks = [...lot.tasks]
    updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], [field]: value }
    onChange({ ...lot, tasks: updatedTasks })
  }

  const handleAddTask = () => {
    const newTask: ImportTask = {
      name: "Nouvelle tâche",
      duration_days: 1,
      budget_ht: 0,
      description: ""
    }
    onChange({ ...lot, tasks: [...lot.tasks, newTask] })
  }

  const handleRemoveTask = (taskIndex: number) => {
    const updatedTasks = lot.tasks.filter((_, index) => index !== taskIndex)
    onChange({ ...lot, tasks: updatedTasks })
  }

  const handleAddDependency = () => {
    const availableLots = allLots.filter(l =>
      l.number !== lot.number &&
      !lot.depends_on.includes(l.number) &&
      !lot.depends_on.includes(`${l.number}_partial`)
    )

    if (availableLots.length > 0) {
      const nextDependency = availableLots[0].number
      onChange({ ...lot, depends_on: [...lot.depends_on, nextDependency] })
    }
  }

  const handleRemoveDependency = (depIndex: number) => {
    const updatedDependencies = lot.depends_on.filter((_, index) => index !== depIndex)
    onChange({ ...lot, depends_on: updatedDependencies })
  }

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  const startEditing = (field: string) => {
    setIsEditing({ ...isEditing, [field]: true })
  }

  const stopEditing = (field: string) => {
    setIsEditing({ ...isEditing, [field]: false })
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          <div>
            <h3 className="font-semibold">
              Lot N°{lot.number} —
              {isEditing.name ? (
                <input
                  type="text"
                  value={lot.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={() => stopEditing('name')}
                  onKeyDown={(e) => e.key === 'Enter' && stopEditing('name')}
                  className="inline-block ml-1 px-2 py-1 border rounded text-sm bg-background"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => startEditing('name')}
                  className="cursor-pointer hover:bg-gray-100 px-1 rounded"
                >
                  {lot.name}
                </span>
              )}
            </h3>
            {lot.calculated_start && lot.calculated_end && (
              <p className="text-sm text-muted-foreground">
                Du {formatDate(lot.calculated_start)} au {formatDate(lot.calculated_end)}
              </p>
            )}
          </div>
        </div>

        {lot.duration_source === 'ai_estimate' ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
            <Zap className="h-3 w-3" />
            IA
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            <FileText className="h-3 w-3" />
            Doc
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Budget HT</label>
          {isEditing.budget ? (
            <input
              type="number"
              value={lot.budget_ht}
              onChange={(e) => handleFieldChange('budget_ht', parseFloat(e.target.value) || 0)}
              onBlur={() => stopEditing('budget')}
              onKeyDown={(e) => e.key === 'Enter' && stopEditing('budget')}
              className="w-full mt-1 px-3 py-1 border rounded text-sm bg-background"
              autoFocus
            />
          ) : (
            <p
              onClick={() => startEditing('budget')}
              className="cursor-pointer hover:bg-gray-100 px-1 rounded mt-1 text-sm font-semibold"
            >
              {lot.budget_ht.toLocaleString('fr-FR')} €
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Entreprise</label>
          {isEditing.contractor ? (
            <input
              type="text"
              value={lot.contractor_name || ''}
              onChange={(e) => handleFieldChange('contractor_name', e.target.value)}
              onBlur={() => stopEditing('contractor')}
              onKeyDown={(e) => e.key === 'Enter' && stopEditing('contractor')}
              className="w-full mt-1 px-3 py-1 border rounded text-sm bg-background"
              autoFocus
            />
          ) : (
            <p
              onClick={() => startEditing('contractor')}
              className="cursor-pointer hover:bg-gray-100 px-1 rounded mt-1 text-sm"
            >
              {lot.contractor_name || 'Non spécifié'}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Durée</label>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2 relative">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((lot.duration_days / 60) * 100, 100)}%` }}
              ></div>
            </div>
            {isEditing.duration ? (
              <input
                type="number"
                value={lot.duration_days}
                onChange={(e) => handleFieldChange('duration_days', parseInt(e.target.value) || 1)}
                onBlur={() => stopEditing('duration')}
                onKeyDown={(e) => e.key === 'Enter' && stopEditing('duration')}
                className="w-16 px-2 py-1 border rounded text-sm bg-background"
                min="1"
                max="120"
                autoFocus
              />
            ) : (
              <span
                onClick={() => startEditing('duration')}
                className="cursor-pointer hover:bg-gray-100 px-1 rounded text-sm font-semibold"
              >
                {lot.duration_days}j
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dépendances */}
      <div className="mt-4">
        <label className="text-sm font-medium text-muted-foreground">Dépend de:</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {lot.depends_on.map((dep, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
            >
              Lot {dep.replace('_partial', '')}
              {dep.endsWith('_partial') && <span className="text-orange-600">(partiel)</span>}
              <button
                onClick={() => handleRemoveDependency(index)}
                className="text-red-600 hover:text-red-800 ml-1"
              >
                ×
              </button>
            </span>
          ))}
          <button
            onClick={handleAddDependency}
            className="inline-flex items-center gap-1 px-2 py-1 border-2 border-dashed border-gray-300 text-gray-600 text-xs rounded-full hover:border-gray-400 hover:text-gray-800 transition-colors"
          >
            <Plus className="h-3 w-3" />
            ajouter
          </button>
        </div>
      </div>

      {/* Tâches (accordéon) */}
      {isExpanded && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Tâches ({lot.tasks.length})</h4>
            <button
              onClick={handleAddTask}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              <Plus className="h-3 w-3" />
              Ajouter une tâche
            </button>
          </div>

          <div className="space-y-3">
            {lot.tasks.map((task, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <input
                    type="text"
                    value={task.name}
                    onChange={(e) => handleTaskChange(index, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border-0 bg-transparent font-medium focus:bg-white focus:border focus:border-gray-300 rounded"
                  />
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div className="text-xs text-muted-foreground">
                      <input
                        type="number"
                        value={task.duration_days}
                        onChange={(e) => handleTaskChange(index, 'duration_days', parseInt(e.target.value) || 1)}
                        className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded"
                        min="1"
                      />
                      jours
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <input
                        type="number"
                        value={task.budget_ht}
                        onChange={(e) => handleTaskChange(index, 'budget_ht', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 text-xs border-0 bg-transparent focus:bg-white focus:border focus:border-gray-300 rounded"
                        min="0"
                      />
                      €
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {task.description}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveTask(index)}
                  className="text-red-600 hover:text-red-800 p-1 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}