'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertTriangle, CheckCircle, Zap, FileText } from 'lucide-react'
import { ImportResponse, ImportLot } from '@/lib/import/types'
import { calculateProjectDurationWeeks, recalculateLotsWithDates } from '@/lib/import/calculateDates'
import ImportPreviewLot from '@/components/ImportPreviewLot'
import ImportMiniGantt from '@/components/ImportMiniGantt'

export default function ImportPreviewPage() {
  const router = useRouter()
  const [importData, setImportData] = useState<ImportResponse & { originalFilename: string } | null>(null)
  const [lots, setLots] = useState<ImportLot[]>([])
  const [startDate, setStartDate] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Récupérer les données depuis sessionStorage
    const storedData = sessionStorage.getItem('importData')
    if (!storedData) {
      router.push('/projects/new')
      return
    }

    try {
      const parsedData = JSON.parse(storedData)
      setImportData(parsedData)
      setLots(parsedData.lots)

      // Date de début par défaut = demain
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setStartDate(tomorrow.toISOString().split('T')[0])
    } catch (err) {
      console.error('Erreur lors du parsing des données:', err)
      router.push('/projects/new')
    }
  }, [router])

  useEffect(() => {
    if (lots.length > 0 && startDate) {
      const startDateObj = new Date(startDate)
      const updatedLots = recalculateLotsWithDates(lots, startDateObj)
      setLots(updatedLots)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate])

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate)
  }

  const handleLotChange = (lotNumber: string, updatedLot: ImportLot) => {
    setLots(prevLots => {
      const newLots = prevLots.map(lot =>
        lot.number === lotNumber ? updatedLot : lot
      )

      // Recalculer les dates après modification
      if (startDate) {
        const startDateObj = new Date(startDate)
        return recalculateLotsWithDates(newLots, startDateObj)
      }

      return newLots
    })
  }

  const handleCreateProject = async () => {
    if (!importData || !startDate) return

    setIsCreating(true)
    setError(null)

    try {
      const projectData = {
        projectData: {
          name: importData.project.name,
          address: importData.project.address,
          client_name: importData.project.client_name,
          contractor_name: importData.project.contractor_name,
          total_budget_ht: importData.project.total_budget_ht,
          start_date: startDate
        },
        lots: lots.filter(lot => lot.calculated_start && lot.calculated_end),
        importMeta: {
          original_filename: importData.originalFilename,
          contractor_name: importData.project.contractor_name,
          total_budget_ht: importData.project.total_budget_ht,
          ai_notes: importData.ai_notes,
          confidence: importData.project.confidence,
          duration_source: importData.project.duration_source
        }
      }

      const response = await fetch('/api/projects/import-dpgf/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du projet')
      }

      // Nettoyer le sessionStorage
      sessionStorage.removeItem('importData')

      // Rediriger vers le projet créé
      router.push(`/projects/${data.projectId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue')
    } finally {
      setIsCreating(false)
    }
  }

  if (!importData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const totalTasks = lots.reduce((acc, lot) => acc + lot.tasks.length, 0)
  const projectDurationWeeks = startDate ? calculateProjectDurationWeeks(lots, new Date(startDate)) : 0
  const endDate = startDate ? calculateProjectDurationWeeks(lots, new Date(startDate)) : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/projects/new"
            className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-lg font-semibold tracking-tight text-primary">Aedis</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche - Infos projet (sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-8 space-y-6">
              <div className="rounded-xl border bg-card p-6 shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Projet importé</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom du projet</label>
                    <input
                      type="text"
                      value={importData.project.name}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                      readOnly
                    />
                  </div>

                  {importData.project.address && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                      <input
                        type="text"
                        value={importData.project.address}
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                        readOnly
                      />
                    </div>
                  )}

                  {importData.project.client_name && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Client</label>
                      <input
                        type="text"
                        value={importData.project.client_name}
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                        readOnly
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Constructeur</label>
                    <input
                      type="text"
                      value={importData.project.contractor_name}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date de début</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Recalcule tout le planning</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget total HT</p>
                      <p className="text-lg font-semibold">{importData.project.total_budget_ht.toLocaleString('fr-FR')} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget total TTC</p>
                      <p className="text-lg font-semibold">{importData.project.total_budget_ttc.toLocaleString('fr-FR')} €</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Durée estimée</p>
                      <p className="text-sm font-semibold">{projectDurationWeeks} semaines</p>
                    </div>
                    {endDate && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date fin estimée</p>
                        <p className="text-sm font-semibold">
                          {new Date(startDate).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confidence et source */}
                {importData.project.confidence === 'low' && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertTriangle className="h-4 w-4" />
                      <p className="text-sm font-medium">Attention</p>
                    </div>
                    <p className="text-xs text-amber-700 mt-1">
                      L&apos;IA n&apos;a pas pu lire certaines parties du document. Vérifiez les durées avant de valider.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-2">
                  {importData.project.duration_source === 'ai_estimate' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      <Zap className="h-3 w-3" />
                      Durées estimées par IA — modifiables
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      <CheckCircle className="h-3 w-3" />
                      Durées issues du document
                    </span>
                  )}
                </div>

                {/* Notes de l'IA */}
                {importData.ai_notes && (
                  <div className="mt-4 p-3 bg-gray-50 border rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-1">Notes de l&apos;IA</p>
                    <p className="text-xs text-gray-600 italic">{importData.ai_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne droite - Lots et tâches */}
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              {lots.map((lot) => (
                <ImportPreviewLot
                  key={lot.number}
                  lot={lot}
                  allLots={lots}
                  onChange={(updatedLot) => handleLotChange(lot.number, updatedLot)}
                />
              ))}
            </div>

            {/* Mini Gantt */}
            {startDate && (
              <div className="rounded-xl border bg-card p-6 shadow-card">
                <h3 className="font-semibold mb-4">Planning prévisionnel</h3>
                <ImportMiniGantt lots={lots} startDate={new Date(startDate)} />
              </div>
            )}
          </div>
        </div>

        {/* Barre sticky en bas */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {lots.length} lots · {totalTasks} tâches · {importData.project.total_budget_ht.toLocaleString('fr-FR')} € HT · ~{projectDurationWeeks} semaines
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/projects/new"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Annuler
              </Link>
              <button
                onClick={handleCreateProject}
                disabled={isCreating || !startDate}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isCreating ? "Création en cours..." : "Créer le projet →"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="fixed top-4 right-4 z-50 p-4 bg-red-50 border border-red-200 rounded-md max-w-sm">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}