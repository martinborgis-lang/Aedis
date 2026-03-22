"use client";

import { createClient } from "@/lib/supabase/client";
import {
  Task,
  TaskStatus,
  Trade,
  TRADE_LABELS,
  TRADE_COLORS,
  STATUS_COLORS,
} from "@/lib/types/database";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

const GanttChart = dynamic(() => import("@/components/GanttChart"), { ssr: false });

type ViewMode = "Day" | "Week" | "Month";
type ColorMode = "status" | "trade";

interface TaskFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  trade: Trade | "";
  dependencies: string[];
}

const EMPTY_FORM: TaskFormData = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "pending",
  trade: "",
  dependencies: [],
};

const DEMO_TASKS: Task[] = [
  {
    id: "demo-task-1",
    project_id: "demo-project-1",
    name: "Terrassement",
    description: "Preparation du terrain",
    start_date: "2024-03-01",
    end_date: "2024-03-10",
    status: "completed",
    progress: 100,
    sort_order: 1,
    trade: "terrassement",
    dependencies: [],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-03-10T10:00:00Z",
  },
  {
    id: "demo-task-2",
    project_id: "demo-project-1",
    name: "Gros oeuvre",
    description: "Fondations et structure",
    start_date: "2024-03-11",
    end_date: "2024-04-15",
    status: "in_progress",
    progress: 60,
    sort_order: 2,
    trade: "gros-oeuvre",
    dependencies: ["demo-task-1"],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-04-01T10:00:00Z",
  },
  {
    id: "demo-task-3",
    project_id: "demo-project-1",
    name: "Plomberie",
    description: "Installation reseaux",
    start_date: "2024-04-16",
    end_date: "2024-05-15",
    status: "pending",
    progress: 0,
    sort_order: 3,
    trade: "plomberie",
    dependencies: ["demo-task-2"],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-task-4",
    project_id: "demo-project-1",
    name: "Electricite",
    description: "Cablage et tableaux",
    start_date: "2024-04-16",
    end_date: "2024-05-20",
    status: "pending",
    progress: 0,
    sort_order: 4,
    trade: "electricite",
    dependencies: ["demo-task-2"],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
  {
    id: "demo-task-5",
    project_id: "demo-project-1",
    name: "Peinture et finitions",
    description: "Peinture des murs et finitions",
    start_date: "2024-05-21",
    end_date: "2024-06-30",
    status: "pending",
    progress: 0,
    sort_order: 5,
    trade: "peinture",
    dependencies: ["demo-task-3", "demo-task-4"],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "En attente",
  in_progress: "En cours",
  completed: "Termine",
};

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export default function PlanningPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const isDemo = projectId?.startsWith("demo-");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("Week");
  const [colorMode, setColorMode] = useState<ColorMode>("status");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM);

  const supabase = createClient();

  const getTaskColor = useCallback(
    (task: Task) => {
      if (colorMode === "trade" && task.trade) {
        return TRADE_COLORS[task.trade];
      }
      return STATUS_COLORS[task.status];
    },
    [colorMode]
  );

  const fetchData = useCallback(async () => {
    if (isDemo) {
      setProjectName("Renovation Maison Dupont");
      setTasks(DEMO_TASKS);
      setLoading(false);
      return;
    }

    try {
      const { data: projectData } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      setProjectName(projectData?.name || "");
      setTasks(
        (tasksData || []).map((t: Task) => ({
          ...t,
          trade: t.trade || null,
          dependencies: t.dependencies || [],
        }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isDemo]);

  const saveTask = async (taskData: TaskFormData, existingId?: string) => {
    if (taskData.start_date && taskData.end_date && taskData.end_date < taskData.start_date) {
      alert("La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but.");
      return;
    }

    const trade = taskData.trade || null;
    const deps = taskData.dependencies;

    if (existingId) {
      if (isDemo) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === existingId
              ? {
                  ...t,
                  ...taskData,
                  trade,
                  dependencies: deps,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
      } else {
        await supabase
          .from("tasks")
          .update({
            name: taskData.name,
            description: taskData.description || null,
            start_date: taskData.start_date,
            end_date: taskData.end_date,
            status: taskData.status,
            trade,
            dependencies: deps,
          })
          .eq("id", existingId);

        setTasks((prev) =>
          prev.map((t) =>
            t.id === existingId
              ? {
                  ...t,
                  ...taskData,
                  trade,
                  dependencies: deps,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
      }
    } else {
      const newId = isDemo ? `demo-task-${Date.now()}` : uuidv4();
      const newTask: Task = {
        id: newId,
        project_id: projectId,
        name: taskData.name,
        description: taskData.description || null,
        start_date: taskData.start_date,
        end_date: taskData.end_date,
        status: taskData.status,
        progress: 0,
        sort_order: tasks.length + 1,
        trade,
        dependencies: deps,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (!isDemo) {
        const { data } = await supabase
          .from("tasks")
          .insert({
            project_id: projectId,
            name: taskData.name,
            description: taskData.description || null,
            start_date: taskData.start_date,
            end_date: taskData.end_date,
            status: taskData.status,
            progress: 0,
            sort_order: tasks.length + 1,
            trade,
            dependencies: deps,
          })
          .select()
          .single();

        if (data) {
          setTasks((prev) => [...prev, { ...data, trade: data.trade || null, dependencies: data.dependencies || [] }]);
          return;
        }
      }
      setTasks((prev) => [...prev, newTask]);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (isDemo) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      return;
    }

    await supabase.from("tasks").delete().eq("id", taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const updateTaskDates = async (
    taskId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    if (isDemo) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                start_date: start,
                end_date: end,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );
      return;
    }

    await supabase
      .from("tasks")
      .update({ start_date: start, end_date: end })
      .eq("id", taskId);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              start_date: start,
              end_date: end,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    const status: TaskStatus = clamped === 100 ? "completed" : clamped > 0 ? "in_progress" : "pending";
    const updates = { progress: clamped, status };

    if (isDemo) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
      );
      return;
    }

    await supabase.from("tasks").update(updates).eq("id", taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const openCreateForm = () => {
    setEditingTask(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (task: Task) => {
    setEditingTask(task);
    setFormData({
      name: task.name,
      description: task.description || "",
      start_date: task.start_date,
      end_date: task.end_date,
      status: task.status,
      trade: task.trade || "",
      dependencies: task.dependencies || [],
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) return;
    await saveTask(formData, editingTask?.id);
    setShowForm(false);
    setEditingTask(null);
    setFormData(EMPTY_FORM);
  };

  const handleDeleteConfirm = async (task: Task) => {
    if (!confirm(`Supprimer "${task.name}" ?`)) return;
    await deleteTask(task.id);
    if (editingTask?.id === task.id) {
      setShowForm(false);
      setEditingTask(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ganttTasks = useMemo(() =>
    tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start_date,
      end: t.end_date,
      progress: t.progress,
      dependencies: (t.dependencies || []).join(","),
      color: getTaskColor(t),
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, colorMode]
  );

  const ganttOptions = useMemo(() => ({
    view_mode: viewMode,
    language: "fr",
    on_click: (task: { id: string }) => {
      const found = tasks.find((t) => t.id === task.id);
      if (found) openEditForm(found);
    },
    on_date_change: (
      task: { id: string },
      start: Date,
      end: Date
    ) => {
      updateTaskDates(task.id, start, end);
    },
    on_progress_change: (
      task: { id: string },
      progress: number
    ) => {
      updateTaskProgress(task.id, progress);
    },
    popup: (ctx: {
      set_title: (s: string) => void;
      set_subtitle: (s: string) => void;
      set_details: (s: string) => void;
      task: { name: string; progress: number; _start: Date; _end: Date };
    }) => {
      ctx.set_title(ctx.task.name);
      ctx.set_subtitle("");
      const startStr = ctx.task._start.toLocaleDateString("fr-FR");
      const endStr = ctx.task._end.toLocaleDateString("fr-FR");
      ctx.set_details(
        `${startStr} - ${endStr}<br/>Progression: ${Math.round(ctx.task.progress)}%`
      );
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [tasks, viewMode]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const getStatusDot = (status: TaskStatus) => {
    const colors: Record<TaskStatus, string> = {
      pending: "bg-amber-500",
      in_progress: "bg-blue-500",
      completed: "bg-emerald-500",
    };
    return colors[status] || "bg-muted-foreground";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-primary hidden sm:inline">Aedis</Link>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <span className="text-sm text-muted-foreground hidden md:inline truncate max-w-[150px]">{projectName}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 hidden md:inline shrink-0" />
            <span className="text-sm font-medium sm:font-normal sm:text-muted-foreground truncate">Planning</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <div className="flex items-center rounded-lg border p-0.5">
              {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => handleViewModeChange(mode)}
                  className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "Day" ? "J" : mode === "Week" ? "S" : "M"}
                  <span className="hidden sm:inline">{mode === "Day" ? "our" : mode === "Week" ? "emaine" : "ois"}</span>
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center rounded-lg border p-0.5">
              <button
                onClick={() => setColorMode("status")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  colorMode === "status"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Statut
              </button>
              <button
                onClick={() => setColorMode("trade")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  colorMode === "trade"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Corps de m&eacute;tier
              </button>
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="px-2 sm:px-3 py-1.5 text-xs font-medium border rounded-md hover:bg-accent transition-colors"
            >
              <span className="sm:hidden">{sidebarOpen ? "\u2715" : "\u2630"}</span>
              <span className="hidden sm:inline">{sidebarOpen ? "Masquer liste" : "Afficher liste"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <aside className="w-full sm:w-80 absolute sm:relative inset-0 top-auto z-30 sm:z-auto border-r bg-card flex flex-col overflow-hidden h-[60vh] sm:h-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                T&acirc;ches ({tasks.length})
              </h2>
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {tasks.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Aucune t&acirc;che. Cliquez &quot;Ajouter&quot; pour
                  commencer.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 hover:bg-accent/50 cursor-pointer group transition-colors"
                      onClick={() => openEditForm(task)}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${getStatusDot(task.status)}`}
                            />
                            <span className="text-sm font-medium truncate">
                              {task.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {formatDate(task.start_date)} -{" "}
                              {formatDate(task.end_date)}
                            </span>
                            {task.trade && (
                              <span
                                className="px-1.5 py-0.5 rounded text-white text-[10px]"
                                style={{
                                  backgroundColor: TRADE_COLORS[task.trade],
                                }}
                              >
                                {TRADE_LABELS[task.trade]}
                              </span>
                            )}
                          </div>
                          {task.dependencies.length > 0 && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                              Dep:{" "}
                              {task.dependencies
                                .map(
                                  (depId) =>
                                    tasks.find((t) => t.id === depId)?.name ||
                                    depId.slice(0, 8)
                                )
                                .join(", ")}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(task);
                            }}
                            className="p-1 rounded-md hover:bg-accent transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConfirm(task);
                            }}
                            className="p-1 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-auto p-8">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="mb-4">
                Aucune t&acirc;che dans ce projet
              </p>
              <button
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Cr&eacute;er une t&acirc;che
              </button>
            </div>
          ) : (
            <GanttChart tasks={ganttTasks} options={ganttOptions} className="w-full" />
          )}
        </main>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border shadow-soft w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold">
                {editingTask ? "Modifier la t\u00e2che" : "Nouvelle t\u00e2che"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  placeholder="Nom de la t&acirc;che"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  rows={2}
                  placeholder="Description (optionnel)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    D&eacute;but
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fin</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Statut
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as TaskStatus,
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Corps de m&eacute;tier
                  </label>
                  <select
                    value={formData.trade}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        trade: e.target.value as Trade | "",
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    <option value="">-- Aucun --</option>
                    {(Object.keys(TRADE_LABELS) as Trade[]).map((t) => (
                      <option key={t} value={t}>
                        {TRADE_LABELS[t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  D&eacute;pendances
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto rounded-md border p-2">
                  {tasks
                    .filter((t) => t.id !== editingTask?.id)
                    .map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.dependencies.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                dependencies: [...formData.dependencies, t.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                dependencies: formData.dependencies.filter(
                                  (d) => d !== t.id
                                ),
                              });
                            }
                          }}
                        />
                        {t.name}
                      </label>
                    ))}
                  {tasks.filter((t) => t.id !== editingTask?.id).length ===
                    0 && (
                    <span className="text-xs text-muted-foreground">
                      Aucune autre t&acirc;che disponible
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  !formData.name || !formData.start_date || !formData.end_date
                }
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {editingTask ? "Enregistrer" : "Cr\u00e9er"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
