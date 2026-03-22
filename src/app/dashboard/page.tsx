"use client"

import { createClient } from "@/lib/supabase/client"
import { Project } from "@/lib/types/database"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Building2, ArrowRight, LogOut } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const MOCK_PROJECTS: Project[] = [
  { id: "demo-1", name: "Rénovation Villa Méditerranée", address: "12 Rue des Oliviers, Nice", client_name: "M. Dupont", status: "active", portal_token: "demo-1", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z", client_email: null, user_id: "demo" },
  { id: "demo-2", name: "Extension Maison Haussmann", address: "45 Avenue Foch, Paris", client_name: "Mme Laurent", status: "active", portal_token: "demo-2", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z", client_email: null, user_id: "demo" },
  { id: "demo-3", name: "Construction Immeuble Écologique", address: "8 Boulevard Vert, Lyon", client_name: "SCI Verte", status: "completed", portal_token: "demo-3", created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z", client_email: null, user_id: "demo" },
]

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadData() {
      const sb = createClient()
      const { data: { user: currentUser } } = await sb.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        const { data: projectsData } = await sb
          .from('projects')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })

        setProjects(projectsData || [])
      } else {
        setProjects(MOCK_PROJECTS)
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const handleLogout = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    window.location.reload()
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'completed':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'archived':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-primary font-bold text-2xl">Aedis</h1>
          {user && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Mes Projets</h2>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Nouveau projet
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 size={64} className="text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Aucun projet</h3>
            <p className="text-muted-foreground mb-6">Commencez par créer votre premier projet</p>
            <Link
              href="/projects/new"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Créer un projet
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-foreground mb-2">{project.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{project.address}</p>
                    <p className="text-foreground text-sm mb-4">Client: {project.client_name}</p>
                    <div className="mb-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getStatusBadgeClass(project.status)}`}>
                        {project.status === 'active' ? 'Actif' : 
                         project.status === 'completed' ? 'Terminé' : 
                         project.status === 'archived' ? 'Archivé' : project.status}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                  >
                    Voir le projet
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}