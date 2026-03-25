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
import ActivityFeed from "@/components/ActivityFeed"

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

function ProjectCard({ project, taskCount, lastActivity }: {
  project: Project;
  taskCount?: {
    total: number;
    completed: number;
    overdue?: number;
    reserves?: number;
  };
  lastActivity?: {
    description: string;
    created_at: string;
    type: string;
  };
}) {
  const progress = taskCount && taskCount.total > 0
    ? Math.round((taskCount.completed / taskCount.total) * 100)
    : 0;

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white border border-gray-100 rounded-xl p-5
                      hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer">

        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-medium text-gray-900">{project.name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{project.address}</p>
          </div>
          {project.status === 'active' ? (
            <span className="flex items-center gap-1.5 text-xs px-2 py-1
                           rounded-full bg-green-50 text-green-700">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full
                               rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5
                               bg-green-500"></span>
              </span>
              Actif
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500">
              {project.status}
            </span>
          )}
        </div>

        {/* Client */}
        <p className="text-sm text-gray-600 mb-3">
          Client : <span className="font-medium">{project.client_name}</span>
        </p>

        {/* Progress bar */}
        {taskCount && taskCount.total > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progression</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-[#E8650A]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Mini stats row */}
        <div className="flex gap-4 pt-3 border-t border-gray-50">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">
              {taskCount?.total || 0}
            </p>
            <p className="text-xs text-gray-400">tâches</p>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${
              (taskCount?.reserves || 0) > 0 ? 'text-orange-500' : 'text-gray-800'
            }`}>
              {taskCount?.reserves || 0}
            </p>
            <p className="text-xs text-gray-400">réserves</p>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold ${
              (taskCount?.overdue || 0) > 0 ? 'text-red-500' : 'text-gray-800'
            }`}>
              {taskCount?.overdue || 0}
            </p>
            <p className="text-xs text-gray-400">retard</p>
          </div>
          {project.created_at && (
            <div className="text-center ml-auto">
              <p className="text-xs text-gray-400">
                {new Date(project.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Recent activity */}
        {lastActivity && (
          <div className="mt-2 pt-2 border-t border-gray-50 flex items-center gap-2">
            <span className="text-xs text-gray-400">Dernière activité :</span>
            <span className="text-xs text-gray-500 truncate">
              {lastActivity.description}
            </span>
            <span className="text-xs text-gray-300 shrink-0 ml-auto">
              {timeAgo(lastActivity.created_at)}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("updated_at")
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; completed: number }>>({})
  const [recentActivities, setRecentActivities] = useState<Record<string, any>>({})

  useEffect(() => {
    async function loadData() {
      const sb = createClient()
      const { data: { user: currentUser } } = await sb.auth.getUser()
      setUser(currentUser)

      if (currentUser) {
        // Get all projects with related data
        const { data: projectsData } = await sb
          .from('projects')
          .select(`
            *,
            tasks(id, status, progress, end_date),
            reserves(id, status)
          `)
          .eq('user_id', currentUser.id)
          .order('updated_at', { ascending: false })

        const loadedProjects = projectsData || []
        setProjects(loadedProjects)

        // Calculate task counts and additional stats
        if (loadedProjects.length > 0) {
          const counts: Record<string, { total: number; completed: number; overdue: number; reserves: number }> = {}
          const today = new Date().toISOString().split('T')[0]

          for (const project of loadedProjects) {
            const projectTasks = (project as any).tasks || []
            const projectReserves = (project as any).reserves || []

            counts[project.id] = {
              total: projectTasks.length,
              completed: projectTasks.filter((t: any) => t.status === 'completed').length,
              overdue: projectTasks.filter((t: any) =>
                t.end_date < today && t.status !== 'completed'
              ).length,
              reserves: projectReserves.filter((r: any) => r.status === 'open').length
            }
          }

          setTaskCounts(counts as any) // Cast to maintain compatibility

          // Check if activity_feed table exists
          const { data: activityCheck, error: activityError } = await sb
            .from('activity_feed')
            .select('*')
            .limit(1)

          console.log('activity_feed table check:', {
            exists: !activityError,
            error: activityError?.message,
            sampleData: activityCheck
          })

          // Fetch last activity per project
          if (!activityError && loadedProjects.length > 0) {
            const { data: recentActivitiesData } = await sb
              .from('activity_feed')
              .select('project_id, description, created_at, type')
              .in('project_id', loadedProjects.map(p => p.id))
              .order('created_at', { ascending: false })

            // Group by project_id, keep only the most recent per project
            const lastActivityByProject = recentActivitiesData?.reduce((acc, activity) => {
              if (!acc[activity.project_id]) {
                acc[activity.project_id] = activity
              }
              return acc
            }, {} as Record<string, any>)

            setRecentActivities(lastActivityByProject || {})
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
    const activeCount = projects.filter(p => p.status === "active").length
    const completed = projects.filter(p => p.status === "completed").length
    const totalTasks = Object.values(taskCounts).reduce((s, c) => s + c.total, 0)
    const completedTasks = Object.values(taskCounts).reduce((s, c) => s + c.completed, 0)
    const overdueCount = Object.values(taskCounts).reduce((s, c) => s + ((c as any).overdue || 0), 0)
    const reservesCount = Object.values(taskCounts).reduce((s, c) => s + ((c as any).reserves || 0), 0)
    return { activeCount, completed, totalTasks, completedTasks, overdueCount, reservesCount }
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
        {/* Small compact stats at the top */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {[
            { label: 'Projets', value: projects.length, icon: '📁' },
            { label: 'Tâches terminées', value: stats.completedTasks, icon: '✓' },
            { label: 'Tâches totales', value: stats.totalTasks, icon: '📋' },
            { label: 'En retard', value: stats.overdueCount, icon: '⚠', alert: stats.overdueCount > 0 },
            { label: 'Réserves ouvertes', value: stats.reservesCount, icon: '🔴', alert: stats.reservesCount > 0 },
          ].map(stat => (
            <div key={stat.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm
                ${stat.alert ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white'}`}>
              <span className="text-base">{stat.icon}</span>
              <span className={`font-semibold ${stat.alert ? 'text-orange-600' : 'text-gray-800'}`}>
                {stat.value}
              </span>
              <span className="text-gray-500">{stat.label}</span>
            </div>
          ))}

          {/* Special active projects stat with animated dot */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm border-gray-100 bg-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full
                             rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5
                             bg-green-500"></span>
            </span>
            <span className="font-semibold text-gray-800">
              {stats.activeCount}
            </span>
            <span className="text-gray-500">Actifs</span>
          </div>
        </div>

        {/* Main content — 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Projects list (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Mes projets</h2>
              <Button asChild>
                <Link href="/projects/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau projet
                </Link>
              </Button>
            </div>

            {/* Search and sort controls */}
            {projects.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
              <div className="space-y-3">
                {filteredProjects.map(project => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    taskCount={taskCounts[project.id]}
                    lastActivity={recentActivities[project.id]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Activity feed (1/3 width) */}
          <div className="lg:col-span-1">
            <ActivityFeed projectIds={projects.map(p => p.id)} />
          </div>

        </div>
      </main>
    </div>
  )
}
