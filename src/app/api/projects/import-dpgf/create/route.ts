import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreateProjectData } from '@/lib/import/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectData = await request.json()
    const { projectData, lots, importMeta } = body

    const supabase = createServerSupabaseClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Transaction pour créer tout d'un coup
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        address: projectData.address,
        client_name: projectData.client_name,
        budget: projectData.total_budget_ht,
        start_date: projectData.start_date,
        status: 'active',
        user_id: user.id,
        portal_token: uuidv4(),
        portal_enabled: false
      })
      .select()
      .single()

    if (projectError) {
      console.error('Erreur création projet:', projectError)
      return NextResponse.json(
        { error: 'Erreur lors de la création du projet' },
        { status: 500 }
      )
    }

    // Créer les tâches (une par lot principal)
    const lotTaskIds: Map<string, string> = new Map()

    for (const lot of lots) {
      // Créer la tâche principale du lot
      const { data: lotTask, error: lotTaskError } = await supabase
        .from('tasks')
        .insert({
          project_id: project.id,
          name: `Lot N°${lot.number} — ${lot.name}`,
          lot: lot.number,
          budget: lot.budget_ht,
          start_date: lot.calculated_start,
          end_date: lot.calculated_end,
          status: 'pending',
          progress: 0,
          trade: lot.contractor_name || null
        })
        .select()
        .single()

      if (lotTaskError) {
        console.error('Erreur création tâche lot:', lotTaskError)
        continue
      }

      lotTaskIds.set(lot.number, lotTask.id)

      // Créer les sous-tâches
      let currentStartDate = new Date(lot.calculated_start)

      for (const task of lot.tasks) {
        const taskEndDate = new Date(currentStartDate)
        taskEndDate.setDate(taskEndDate.getDate() + task.duration_days)

        await supabase
          .from('tasks')
          .insert({
            project_id: project.id,
            name: task.name,
            lot: lot.number,
            budget: task.budget_ht,
            start_date: currentStartDate.toISOString(),
            end_date: taskEndDate.toISOString(),
            status: 'pending',
            progress: 0,
            description: task.description || null
          })

        // La prochaine tâche commence après celle-ci
        currentStartDate = new Date(taskEndDate)
        currentStartDate.setDate(currentStartDate.getDate() + 1)
      }
    }

    // Créer les dépendances entre lots (si la table dependencies existe)
    // Note: Cette table n'existe pas encore dans le schéma actuel
    // On pourrait l'ajouter plus tard ou stocker les dépendances différemment

    // Logger l'import
    await supabase
      .from('project_imports')
      .insert({
        project_id: project.id,
        original_filename: importMeta.original_filename,
        contractor_name: importMeta.contractor_name,
        total_lots: lots.length,
        total_tasks: lots.reduce((acc, lot) => acc + lot.tasks.length, 0),
        total_budget_ht: importMeta.total_budget_ht,
        ai_notes: importMeta.ai_notes,
        confidence: importMeta.confidence,
        duration_source: importMeta.duration_source
      })

    return NextResponse.json({ projectId: project.id })

  } catch (error) {
    console.error('Erreur création projet import:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}