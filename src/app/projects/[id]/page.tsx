"use client";

import { createClient } from "@/lib/supabase/client";
import { Project, Task, Photo, TaskStatus } from "@/lib/types/database";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Camera, Copy, Check, ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";

const DEMO_PROJECT: Project = {
  id: "demo-project-1",
  name: "Rénovation Maison Dupont",
  status: "active",
  client_name: "Famille Dupont",
  client_email: null,
  address: "123 Rue de la Paix, 75001 Paris",
  portal_token: "demo-token-123",
  user_id: "demo",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-03-01T10:00:00Z",
};

const DEMO_TASKS = [
  {
    id: "demo-task-1",
    project_id: "demo-project-1",
    name: "Démolition intérieure",
    description: "Démolition des cloisons non porteuses",
    start_date: "2024-03-01",
    end_date: "2024-03-15",
    status: "completed" as TaskStatus,
    progress: 100,
    sort_order: 1,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "demo-task-2",
    project_id: "demo-project-1",
    name: "Plomberie et électricité",
    description: "Installation des réseaux plomberie et électricité",
    start_date: "2024-03-16",
    end_date: "2024-04-15",
    status: "in_progress" as TaskStatus,
    progress: 60,
    sort_order: 2,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-04-01T10:00:00Z",
  },
  {
    id: "demo-task-3",
    project_id: "demo-project-1",
    name: "Peinture et finitions",
    description: "Peinture des murs et pose des finitions",
    start_date: "2024-04-16",
    end_date: "2024-05-30",
    status: "pending" as TaskStatus,
    progress: 0,
    sort_order: 3,
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z",
  },
];

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const isDemo = projectId?.startsWith("demo-");

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const ganttRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const fetchProjectData = useCallback(async () => {
    if (isDemo) {
      setProject(DEMO_PROJECT);
      setTasks(DEMO_TASKS);
      setLoading(false);
      return;
    }

    try {
      const { data: projectData } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      setProject(projectData);
      setTasks(tasksData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isDemo]);

  const fetchPhotos = useCallback(async (taskId: string) => {
    if (isDemo) {
      setPhotos([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]);

  const addTask = async () => {
    if (!newTask.name || !project) return;

    if (isDemo) {
      const task = {
        id: `demo-task-${Date.now()}`,
        project_id: project.id,
        ...newTask,
        status: "pending" as TaskStatus,
        progress: 0,
        sort_order: tasks.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTasks([...tasks, task]);
      setNewTask({ name: "", description: "", start_date: "", end_date: "" });
      setShowTaskForm(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("tasks")
        .insert({
          project_id: project.id,
          ...newTask,
          status: "pending",
          progress: 0,
          sort_order: tasks.length + 1,
        })
        .select()
        .single();

      if (data) {
        setTasks([...tasks, data]);
        setNewTask({ name: "", description: "", start_date: "", end_date: "" });
        setShowTaskForm(false);
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    if (isDemo) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status, updated_at: new Date().toISOString() } : t));
      return;
    }

    try {
      await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    if (isDemo) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, progress, updated_at: new Date().toISOString() } : t));
      return;
    }

    try {
      await supabase
        .from("tasks")
        .update({ progress })
        .eq("id", taskId);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, progress } : t));
    } catch (error) {
      console.error("Error updating task progress:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (isDemo) {
      setTasks(tasks.filter(t => t.id !== taskId));
      return;
    }

    try {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedTaskId || !project || isDemo) return;

    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${project.id}/${selectedTaskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      const { data: photoData } = await supabase
        .from("photos")
        .insert({
          task_id: selectedTaskId,
          project_id: project.id,
          url: urlData.publicUrl,
          caption: file.name,
          uploaded_by: null,
        })
        .select()
        .single();

      if (photoData) {
        setPhotos([photoData, ...photos]);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  };

  const copyPortalLink = () => {
    if (!project?.portal_token) return;
    
    const url = `${window.location.origin}/portal/${project.portal_token}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProgressBarColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchPhotos(selectedTaskId);
    }
  }, [selectedTaskId, fetchPhotos]);

  useEffect(() => {
    if (tasks.length === 0 || !ganttRef.current) return;
    
    const loadGantt = async () => {
      const { default: Gantt } = await import("frappe-gantt");
      
      const link = document.getElementById("gantt-css") as HTMLLinkElement;
      if (!link) {
        const cssLink = document.createElement("link");
        cssLink.id = "gantt-css";
        cssLink.rel = "stylesheet";
        cssLink.href = "https://cdn.jsdelivr.net/npm/frappe-gantt@1.2.2/dist/frappe-gantt.min.css";
        document.head.appendChild(cssLink);
      }
      
      ganttRef.current!.innerHTML = "";
      
      const ganttTasks = tasks.map((t) => ({
        id: t.id,
        name: t.name,
        start: t.start_date,
        end: t.end_date,
        progress: t.progress,
      }));
      
      new Gantt(ganttRef.current!, ganttTasks, {
        view_mode: "Week",
        custom_popup_html: (task: { name: string; progress: number }) =>
          `<div class="p-2"><b>${task.name}</b><br/>Progression: ${task.progress}%</div>`,
      });
    };
    
    loadGantt();
  }, [tasks]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Projet non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getStatusBadgeColor(project.status)}`}>
                {project.status === "active" ? "Actif" :
                 project.status === "completed" ? "Terminé" :
                 project.status === "archived" ? "Archivé" : project.status}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Adresse</h3>
              <p className="text-sm text-muted-foreground">{project.address}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Client</h3>
              <p className="text-sm text-muted-foreground">{project.client_name}</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <h3 className="font-medium mb-2">Portail client</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded flex-1">
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">/portal/{project.portal_token}</span>
              </div>
              <button
                onClick={copyPortalLink}
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {copySuccess ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copySuccess ? "Copié" : "Copier"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Tâches</h2>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </button>
          </div>

          {showTaskForm && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nom de la tâche"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="px-3 py-2 border rounded bg-background"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="px-3 py-2 border rounded bg-background"
                />
                <input
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                  className="px-3 py-2 border rounded bg-background"
                />
                <input
                  type="date"
                  value={newTask.end_date}
                  onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                  className="px-3 py-2 border rounded bg-background"
                />
              </div>
              <button
                onClick={addTask}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Ajouter
              </button>
            </div>
          )}

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                      <h3 className="font-medium">{task.name}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {task.start_date} - {task.end_date}
                    </p>
                    
                    <div className="mb-3">
                      <div className="h-2 bg-border rounded mb-1">
                        <div
                          className={`h-full rounded ${getProgressBarColor(task.status)}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="text-xs px-2 py-1 border rounded bg-background"
                      >
                        <option value="pending">En attente</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminé</option>
                      </select>
                      
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={task.progress}
                        onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value) || 0)}
                        className="text-xs px-2 py-1 border rounded bg-background w-16"
                      />
                      
                      <button
                        onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                        className={`p-1 rounded hover:bg-muted ${selectedTaskId === task.id ? 'bg-primary text-primary-foreground' : ''}`}
                      >
                        <Camera className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Planning Gantt</h2>
          <div ref={ganttRef} className="w-full overflow-x-auto" />
        </div>

        {selectedTaskId && (
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              Photos - {tasks.find(t => t.id === selectedTaskId)?.name}
            </h2>
            
            {isDemo ? (
              <div className="text-center py-8 text-muted-foreground">
                Photos disponibles après connexion
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || "Photo"}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{photo.caption}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}