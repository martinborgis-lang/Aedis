"use client"

import { createClient } from "@/lib/supabase/client"
import { Project } from "@/lib/types/database"
import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Plus, Building2, ArrowRight, Search, ArrowUpDown, FolderKanban, CheckCircle2, Clock, TrendingUp } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { Header } from "@/components/Header"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

const MOCK_PROJECTS: Project[] = [
  { id: "demo-1", name: "R\u00e9novation Villa M\u00e9diterran\u00e9e", address: "12 Rue des Oliviers, Nice", client_name: "M. Dupont", status: "active", portal_token: "demo-1", portal_enabled: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-03-15T00:00:00Z", client_email: null, client_phone: null, description: null, start_date: null, estimated_end_date: null, model_url: null, user_id: "demo" },
  { id: "demo-2", name: "Extension Maison Haussmann", address: "45 Avenue Foch, Paris", client_name: "Mme Laurent", status: "active", portal_token: "demo-2", portal_enabled: true, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-02-20T00:00:00Z", client_email: null, client_phone: null, description: null, start_date: null, estimated_end_date: null, model_url: null, user_id: "demo" },
  { id: "demo-3", name: "Construction Immeuble \u00c9cologique", address: "8 Boulevard Vert, Lyon", client_name: "SCI Verte", status: "completed", portal_token: "demo-3", portal_enabled: false, created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-10T00:00:00Z", client_email: null, client_phone: null, description: null, start_date: null, estimated_end_date: null, model_url: null, user_id: "demo" },
]

type SortKey = "updated_at" | "name" | "status"

const SORT_LABELS: Record<SortKey, string> = {
  updated_at: "Derni\u00e8re mise \u00e0 jour",
  name: "Nom",
  status: "Statut",
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("updated_at")
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; completed: number }>>({})

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
          .order('updated_at', { ascending: false })

        const loadedProjects = projectsData || []
        setProjects(loadedProjects)

        if (loadedProjects.length > 0) {
          const { data: tasksData } = await sb
            .from('tasks')
            .select('project_id, status')
            .in('project_id', loadedProjects.map(p => p.id))

          if (tasksData) {
            const counts: Record<string, { total: number; completed: number }> = {}
            for (const t of tasksData) {
              if (!counts[t.project_id]) counts[t.project_id] = { total: 0, completed: 0 }
              counts[t.project_id].total++
              if (t.status === 'completed') counts[t.project_id].completed++
            }
            setTaskCounts(counts)
          }
        }
      } else {
        setProjects(MOCK_PROJECTS)
        setTaskCounts({
          "demo-1": { total: 5, completed: 2 },
          "demo-2": { total: 3, completed: 1 },
          "demo-3": { total: 4, completed: 4 },
        })
      }

      setLoading(false)
    }

    loadData()
  }, [])

  const filteredProjects = useMemo(() => {
    let result = projects

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q)
      )
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "fr")
        case "status":
          return a.status.localeCompare(b.status)
        case "updated_at":
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      }
    })

    return result
  }, [projects, search, sortBy])

  const getProgress = (projectId: string) => {
    const counts = taskCounts[projectId]
    if (!counts || counts.total === 0) return null
    return Math.round((counts.completed / counts.total) * 100)
  }

  const stats = useMemo(() => {
    const active = projects.filter(p => p.status === "active").length
    const completed = projects.filter(p => p.status === "completed").length
    const totalTasks = Object.values(taskCounts).reduce((s, c) => s + c.total, 0)
    const completedTasks = Object.values(taskCounts).reduce((s, c) => s + c.completed, 0)
    return { active, completed, totalTasks, completedTasks }
  }, [projects, taskCounts])

  const handleLogout = async () => {
    const sb = createClient()
    await sb.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onLogout={user ? handleLogout : undefined} />

      {!user && (
        <div className="border-b bg-warning/5 px-4 py-2">
          <p className="text-center text-sm text-muted-foreground">
            Mode d&eacute;monstration &mdash;{" "}
            <a href="/auth" className="text-primary font-medium hover:underline">
              Connectez-vous
            </a>{" "}
            pour cr&eacute;er vos propres projets
          </p>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-accent/10 p-3">
                  <FolderKanban className="h-5 w-5 text-accent" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{projects.length}</p>
                  <p className="text-sm text-muted-foreground">Projets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-emerald-500/10 p-3">
                  <Clock className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-sm text-muted-foreground">Actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-blue-500/10 p-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats.completedTasks}</p>
                  <p className="text-sm text-muted-foreground">T&acirc;ches termin&eacute;es</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="rounded-xl bg-purple-500/10 p-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                  <p className="text-sm text-muted-foreground">T&acirc;ches totales</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Mes Projets</h2>
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </Link>
          </Button>
        </div>

        {projects.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un projet..."
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: SortKey) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={SORT_LABELS[sortBy]} />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {SORT_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Aucun projet</h3>
            <p className="text-sm text-muted-foreground mb-6">Commencez par cr&eacute;er votre premier projet</p>
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                Cr&eacute;er un projet
              </Link>
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">Aucun r&eacute;sultat</h3>
            <p className="text-sm text-muted-foreground">
              Aucun projet ne correspond &agrave; &laquo; {search} &raquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const progress = getProgress(project.id)
              return (
                <Card key={project.id} className="group hover:shadow-lg transition-all duration-200 hover:border-accent/20">
                  <Link href={`/projects/${project.id}`} className="block">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base text-foreground group-hover:text-accent transition-colors line-clamp-2">
                              {project.name}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1">{project.address}</p>
                            <p className="text-foreground/70 text-sm">{project.client_name}</p>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>

                        {progress !== null && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="font-medium text-foreground">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {new Date(project.updated_at).toLocaleDateString("fr-FR")}
                          </span>
                          <span className="flex items-center gap-1 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Ouvrir <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
