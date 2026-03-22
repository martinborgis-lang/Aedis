"use client";

import { createClient } from "@/lib/supabase/client";
import { Project, Task, Photo, TaskStatus, ArtisanToken, Report } from "@/lib/types/database";
const loadPDFGenerator = () => import("@/components/ProjectPDFReport").then(m => m.generateProjectPDF);
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Camera, Copy, Check, ExternalLink, Settings, CalendarDays, Wrench, Link2, Pencil, X, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { v4 as uuidv4 } from "uuid";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { PhotoThumbnailGrid } from "@/components/PhotoThumbnailGrid";
import { ReservesList } from "@/components/ReservesList";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ProgressBar } from "@/components/ProgressBar";

const GanttChart = dynamic(() => import("@/components/GanttChart"), { ssr: false });

const DEMO_PROJECT: Project = {
  id: "demo-project-1",
  name: "R\u00e9novation Maison Dupont",
  status: "active",
  client_name: "Famille Dupont",
  client_email: null,
  client_phone: null,
  description: null,
  start_date: null,
  estimated_end_date: null,
  address: "123 Rue de la Paix, 75001 Paris",
  portal_token: "demo-token-123",
  portal_enabled: true,
  user_id: "demo",
  created_at: "2024-01-15T10:00:00Z",
  updated_at: "2024-03-01T10:00:00Z",
};

const DEMO_TASKS = [
  {
    id: "demo-task-1",
    project_id: "demo-project-1",
    name: "D\u00e9molition int\u00e9rieure",
    description: "D\u00e9molition des cloisons non porteuses",
    start_date: "2024-03-01",
    end_date: "2024-03-15",
    status: "completed" as TaskStatus,
    progress: 100,
    sort_order: 1,
    trade: null,
    dependencies: [],
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-03-15T10:00:00Z",
  },
  {
    id: "demo-task-2",
    project_id: "demo-project-1",
    name: "Plomberie et \u00e9lectricit\u00e9",
    description: "Installation des r\u00e9seaux plomberie et \u00e9lectricit\u00e9",
    start_date: "2024-03-16",
    end_date: "2024-04-15",
    status: "in_progress" as TaskStatus,
    progress: 60,
    sort_order: 2,
    trade: null,
    dependencies: [],
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
    trade: null,
    dependencies: [],
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
  const [allPhotos, setAllPhotos] = useState<Record<string, Photo[]>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [artisanTokens, setArtisanTokens] = useState<Record<string, ArtisanToken[]>>({});
  const [artisanNameInput, setArtisanNameInput] = useState<Record<string, string>>({});
  const [showArtisanForm, setShowArtisanForm] = useState<string | null>(null);
  const [copiedArtisanToken, setCopiedArtisanToken] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    description: "",
    start_date: "",
    estimated_end_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [activeTab, setActiveTab] = useState<"projet" | "reserves" | "rapports">("projet");
  const [reportNotes, setReportNotes] = useState("");

  const router = useRouter();
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

  const fetchAllPhotos = useCallback(async () => {
    if (isDemo) {
      setAllPhotos({});
      return;
    }

    try {
      const { data } = await supabase
        .from("photos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (data) {
        const grouped: Record<string, Photo[]> = {};
        for (const photo of data) {
          if (!grouped[photo.task_id]) grouped[photo.task_id] = [];
          grouped[photo.task_id].push(photo);
        }
        setAllPhotos(grouped);
      }
    } catch (error) {
      console.error("Error fetching all photos:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isDemo]);

  const addTask = async () => {
    if (!newTask.name || !project) return;
    if (newTask.start_date && newTask.end_date && newTask.end_date < newTask.start_date) {
      alert("La date de fin doit \u00eatre apr\u00e8s la date de d\u00e9but.");
      return;
    }

    if (isDemo) {
      const task = {
        id: `demo-task-${Date.now()}`,
        project_id: project.id,
        ...newTask,
        status: "pending" as TaskStatus,
        progress: 0,
        sort_order: tasks.length + 1,
        trade: null,
        dependencies: [],
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
    const progress = status === "completed" ? 100 : status === "pending" ? 0 : undefined;
    const updates: { status: TaskStatus; progress?: number } = { status };
    if (progress !== undefined) updates.progress = progress;

    if (isDemo) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      return;
    }

    try {
      await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const updateTaskProgress = async (taskId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, progress));
    const status: TaskStatus = clamped === 100 ? "completed" : clamped > 0 ? "in_progress" : "pending";
    const updates = { progress: clamped, status };

    if (isDemo) {
      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates, updated_at: new Date().toISOString() } : t));
      return;
    }

    try {
      await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
    } catch (error) {
      console.error("Error updating task progress:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Supprimer cette t\u00e2che ?")) return;

    if (isDemo) {
      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
      return;
    }

    try {
      await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      setTasks(tasks.filter(t => t.id !== taskId));
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handlePhotoUpload = async (files: File[]) => {
    if (!selectedTaskId || !project || isDemo) return;

    const newPhotos: Photo[] = [];
    for (const file of files) {
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
          newPhotos.push(photoData);
        }
      } catch (error) {
        console.error("Error uploading photo:", error);
      }
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...newPhotos, ...prev]);
      setAllPhotos((prev) => ({
        ...prev,
        [selectedTaskId]: [...newPhotos, ...(prev[selectedTaskId] || [])],
      }));
    }
  };

  const deletePhoto = async (photoId: string) => {
    if (isDemo || !selectedTaskId) return;

    try {
      await supabase
        .from("photos")
        .delete()
        .eq("id", photoId);

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      setAllPhotos((prev) => ({
        ...prev,
        [selectedTaskId]: (prev[selectedTaskId] || []).filter((p) => p.id !== photoId),
      }));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const copyPortalLink = () => {
    if (!project?.portal_token) return;

    const url = `${window.location.origin}/portal/${project.portal_token}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const togglePortalEnabled = async () => {
    if (isDemo || !project) return;

    const newValue = !project.portal_enabled;
    try {
      await supabase
        .from("projects")
        .update({ portal_enabled: newValue })
        .eq("id", project.id);

      setProject({ ...project, portal_enabled: newValue });
    } catch (error) {
      console.error("Error toggling portal:", error);
    }
  };

  const updateProjectStatus = async (status: "active" | "completed" | "archived") => {
    if (isDemo || !project) return;

    try {
      await supabase
        .from("projects")
        .update({ status })
        .eq("id", project.id);

      setProject({ ...project, status });
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const openEditModal = () => {
    if (!project) return;
    setEditForm({
      name: project.name,
      address: project.address,
      client_name: project.client_name,
      client_email: project.client_email || "",
      client_phone: project.client_phone || "",
      description: project.description || "",
      start_date: project.start_date || "",
      estimated_end_date: project.estimated_end_date || "",
    });
    setShowEditModal(true);
    setShowSettings(false);
  };

  const saveProjectEdits = async () => {
    if (isDemo || !project || !editForm.name.trim() || !editForm.address.trim() || !editForm.client_name.trim()) return;

    setSaving(true);
    try {
      const updates = {
        name: editForm.name.trim(),
        address: editForm.address.trim(),
        client_name: editForm.client_name.trim(),
        client_email: editForm.client_email.trim() || null,
        client_phone: editForm.client_phone.trim() || null,
        description: editForm.description.trim() || null,
        start_date: editForm.start_date || null,
        estimated_end_date: editForm.estimated_end_date || null,
      };

      await supabase
        .from("projects")
        .update(updates)
        .eq("id", project.id);

      setProject({ ...project, ...updates });
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async () => {
    if (isDemo || !project) return;
    if (!confirm("\u00cates-vous s\u00fbr de vouloir supprimer ce projet ? Cette action est irr\u00e9versible.")) return;

    try {
      await supabase
        .from("projects")
        .delete()
        .eq("id", project.id);

      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const getStatusDotColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "bg-amber-500";
      case "in_progress":
        return "bg-blue-500";
      case "completed":
        return "bg-emerald-500";
      default:
        return "bg-muted-foreground";
    }
  };

  const fetchArtisanTokens = useCallback(async () => {
    if (isDemo) return;

    try {
      const { data } = await supabase
        .from("artisan_tokens")
        .select("*")
        .eq("project_id", projectId);

      if (data) {
        const grouped: Record<string, ArtisanToken[]> = {};
        for (const t of data) {
          if (!grouped[t.task_id]) grouped[t.task_id] = [];
          grouped[t.task_id].push(t);
        }
        setArtisanTokens(grouped);
      }
    } catch (error) {
      console.error("Error fetching artisan tokens:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isDemo]);

  const generateArtisanLink = async (taskId: string) => {
    const name = artisanNameInput[taskId]?.trim();
    if (!name || !project || isDemo) return;

    try {
      const newToken = uuidv4();
      const { data, error } = await supabase
        .from("artisan_tokens")
        .insert({
          project_id: project.id,
          task_id: taskId,
          artisan_name: name,
          token: newToken,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setArtisanTokens((prev) => ({
          ...prev,
          [taskId]: [...(prev[taskId] || []), data],
        }));
        setArtisanNameInput((prev) => ({ ...prev, [taskId]: "" }));
        setShowArtisanForm(null);
      }
    } catch (error) {
      console.error("Error generating artisan link:", error);
    }
  };

  const copyArtisanLink = (token: string) => {
    const url = `${window.location.origin}/artisan/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedArtisanToken(token);
    setTimeout(() => setCopiedArtisanToken(null), 2000);
  };

  const fetchReports = useCallback(async () => {
    if (isDemo) return;

    try {
      const { data } = await supabase
        .from("reports")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isDemo]);

  const generateReport = async () => {
    if (!project || isDemo || generatingPDF) return;

    setGeneratingPDF(true);
    try {
      const generateProjectPDF = await loadPDFGenerator();
      const pdfBlob = await generateProjectPDF(project, tasks, allPhotos, reportNotes);

      // Upload to Supabase Storage
      const fileName = `rapport_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      const filePath = `${project.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("reports")
        .upload(filePath, pdfBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("reports")
        .getPublicUrl(filePath);

      // Save report record to database
      const { data: reportData, error: insertError } = await supabase
        .from("reports")
        .insert({
          project_id: project.id,
          pdf_url: urlData.publicUrl,
          notes: reportNotes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (reportData) {
        setReports((prev) => [reportData, ...prev]);
        setReportNotes("");

        // Download the PDF
        const link = document.createElement("a");
        link.href = urlData.publicUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Erreur lors de la génération du rapport");
    } finally {
      setGeneratingPDF(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    fetchAllPhotos();
    fetchArtisanTokens();
    fetchReports();
  }, [fetchProjectData, fetchAllPhotos, fetchArtisanTokens, fetchReports]);

  useEffect(() => {
    if (selectedTaskId) {
      fetchPhotos(selectedTaskId);
    }
  }, [selectedTaskId, fetchPhotos]);

  const ganttTasks = useMemo(() =>
    tasks.map((t) => ({
      id: t.id,
      name: t.name,
      start: t.start_date,
      end: t.end_date,
      progress: t.progress,
    })),
    [tasks]
  );

  const ganttOptions = useMemo(() => ({
    view_mode: "Week" as const,
    custom_popup_html: (task: { name: string; progress: number }) =>
      `<div class="p-2"><b>${task.name}</b><br/>Progression: ${task.progress}%</div>`,
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Projet non trouv\u00e9</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-primary">
              Aedis
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[200px]">{project.name}</span>
          </div>
          {!isDemo && (
            <div className="flex items-center gap-2">
              <button
                onClick={generateReport}
                disabled={generatingPDF}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                {generatingPDF ? "Génération..." : "Générer un rapport"}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="inline-flex items-center justify-center rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4" />
                </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-card shadow-soft z-10">
                  <div className="p-1">
                    <button
                      onClick={openEditModal}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Modifier
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => { updateProjectStatus("active"); setShowSettings(false); }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      Marquer actif
                    </button>
                    <button
                      onClick={() => { updateProjectStatus("completed"); setShowSettings(false); }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      Marquer termin\u00e9
                    </button>
                    <button
                      onClick={() => { updateProjectStatus("archived"); setShowSettings(false); }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      Archiver
                    </button>
                    <div className="my-1 h-px bg-border" />
                    <button
                      onClick={() => { deleteProject(); setShowSettings(false); }}
                      className="flex w-full items-center rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      Supprimer le projet
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>

        {/* Tabs - Simple Implementation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('projet')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'projet'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Projet
          </button>
          <button
            onClick={() => setActiveTab('reserves')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'reserves'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Réserves
          </button>
          <button
            onClick={() => setActiveTab('rapports')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rapports'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Rapports ({reports.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'projet' && (
          <div className="space-y-6">
            <Card>
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Adresse</p>
              <p className="text-sm">{project.address}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Client</p>
              <p className="text-sm">{project.client_name}</p>
              {project.client_email && <p className="text-xs text-muted-foreground mt-0.5">{project.client_email}</p>}
              {project.client_phone && <p className="text-xs text-muted-foreground">{project.client_phone}</p>}
            </div>
            {project.description && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
            {(project.start_date || project.estimated_end_date) && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Dates</p>
                <p className="text-sm">
                  {project.start_date && new Date(project.start_date + "T00:00:00").toLocaleDateString("fr-FR")}
                  {project.start_date && project.estimated_end_date && " \u2014 "}
                  {project.estimated_end_date && new Date(project.estimated_end_date + "T00:00:00").toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
            {!isDemo && (
              <div className="md:col-span-2">
                <button
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                >
                  <Pencil className="h-3 w-3" />
                  Modifier les informations
                </button>
              </div>
            )}
          </div>

          <div className="border-t p-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Portail client</p>
              {!isDemo && (
                <button
                  onClick={togglePortalEnabled}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    project.portal_enabled ? "bg-primary" : "bg-border"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      project.portal_enabled ? "translate-x-[18px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              )}
            </div>
            {project.portal_enabled ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 flex-1 min-w-0">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">/portal/{project.portal_token}</span>
                </div>
                <button
                  onClick={copyPortalLink}
                  className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {copySuccess ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copySuccess ? "Copi\u00e9" : "Copier"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Activez le portail pour partager l&apos;avancement avec votre client
              </p>
            )}
          </div>
        </Card>

        <div className="rounded-xl border bg-card shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold">T&acirc;ches</h2>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
          </div>

          {showTaskForm && (
            <div className="mb-6 rounded-lg border bg-muted/30 p-4">
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Nom de la t\u00e2che"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
                <input
                  type="date"
                  value={newTask.start_date}
                  onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                  className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
                <input
                  type="date"
                  value={newTask.end_date}
                  onChange={(e) => setNewTask({ ...newTask, end_date: e.target.value })}
                  className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
              <button
                onClick={addTask}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Ajouter
              </button>
            </div>
          )}

          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDotColor(task.status)}`} />
                      <h3 className="text-sm font-medium truncate">{task.name}</h3>
                    </div>
                    {task.description && (
                      <p className="text-xs text-muted-foreground mb-1.5 ml-4">{task.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mb-2 ml-4">
                      {task.start_date} &mdash; {task.end_date}
                    </p>

                    <div className="ml-4">
                      <ProgressBar progress={task.progress} status={task.status} className="mb-3" />
                    </div>

                    {(allPhotos[task.id]?.length || 0) > 0 && (
                      <div className="ml-4 mb-3">
                        <PhotoThumbnailGrid photos={allPhotos[task.id]} maxVisible={4} />
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 flex-wrap ml-4">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                        className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
                        className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm w-14 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      />

                      <button
                        onClick={() => setSelectedTaskId(selectedTaskId === task.id ? null : task.id)}
                        className={`inline-flex items-center justify-center rounded-md h-7 w-7 transition-colors ${selectedTaskId === task.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}
                      >
                        <Camera className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => setShowArtisanForm(showArtisanForm === task.id ? null : task.id)}
                        className={`inline-flex items-center justify-center rounded-md h-7 w-7 transition-colors ${showArtisanForm === task.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}
                        title="Lien artisan"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="inline-flex items-center justify-center rounded-md h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {showArtisanForm === task.id && !isDemo && (
                      <div className="mt-3 ml-4 rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-medium">Liens artisan</span>
                        </div>

                        {(artisanTokens[task.id] || []).map((at) => (
                          <div key={at.id} className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-muted-foreground flex-1 truncate">
                              {at.artisan_name}
                            </span>
                            <button
                              onClick={() => copyArtisanLink(at.token)}
                              className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 text-[11px] hover:bg-accent transition-colors"
                            >
                              {copiedArtisanToken === at.token ? (
                                <><Check className="h-3 w-3" /> Copi&eacute;</>
                              ) : (
                                <><Copy className="h-3 w-3" /> Copier</>
                              )}
                            </button>
                          </div>
                        ))}

                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Nom de l'artisan"
                            value={artisanNameInput[task.id] || ""}
                            onChange={(e) =>
                              setArtisanNameInput((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                            className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm flex-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                            onKeyDown={(e) => e.key === "Enter" && generateArtisanLink(task.id)}
                          />
                          <button
                            onClick={() => generateArtisanLink(task.id)}
                            className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            G&eacute;n&eacute;rer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Planning Gantt</h2>
            <Link
              href={`/projects/${projectId}/planning`}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Ouvrir le planning
            </Link>
          </div>
          {ganttTasks.length > 0 && (
            <GanttChart tasks={ganttTasks} options={ganttOptions} className="w-full overflow-x-auto" />
          )}
        </div>

        {selectedTaskId && (
          <div className="rounded-xl border bg-card shadow-card p-6">
            <h2 className="text-base font-semibold mb-4">
              Photos &mdash; {tasks.find(t => t.id === selectedTaskId)?.name}
            </h2>

            {isDemo ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Photos disponibles apr&egrave;s connexion
              </div>
            ) : (
              <>
                <PhotoUpload onUpload={handlePhotoUpload} className="mb-4" />

                {photos.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo, i) => (
                      <div key={photo.id} className="relative group">
                        <div className="cursor-pointer" onClick={() => setLightboxIndex(i)}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || "Photo"}
                            className="w-full h-32 object-cover rounded-lg border group-hover:border-primary transition-colors"
                          />
                        </div>
                        <button
                          onClick={() => deletePhoto(photo.id)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <p className="text-xs text-muted-foreground mt-1">{photo.caption}</p>
                        <p className="text-[11px] text-muted-foreground/60">
                          {new Date(photo.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {lightboxIndex !== null && (
                  <PhotoLightbox
                    photos={photos}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                  />
                )}
              </>
            )}
          </div>
        )}
          </div>
        )}

        {activeTab === 'reserves' && (
          <div className="space-y-6">
            <ReservesList projectId={project.id} isDemo={isDemo} />
          </div>
        )}

        {activeTab === 'rapports' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Génération de rapport</CardTitle>
                <CardDescription>
                  Créez un rapport PDF avec l&apos;état actuel du projet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-notes">Notes du rapport</Label>
                  <Textarea
                    id="report-notes"
                    placeholder="Ajoutez vos commentaires pour ce rapport..."
                    value={reportNotes}
                    onChange={(e) => setReportNotes(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={generateReport}
                  disabled={generatingPDF || isDemo}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {generatingPDF ? "Génération en cours..." : "Générer un rapport PDF"}
                </Button>
              </CardContent>
            </Card>

            {reports.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Rapports générés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Rapport du {new Date(report.created_at).toLocaleDateString("fr-FR")}
                          </p>
                          {report.notes && (
                            <p className="text-sm text-muted-foreground">{report.notes}</p>
                          )}
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border shadow-soft w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold">Modifier le projet</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-md hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du projet</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adresse</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nom du client</label>
                <input
                  type="text"
                  value={editForm.client_name}
                  onChange={(e) => setEditForm({ ...editForm, client_name: e.target.value })}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email client</label>
                  <input
                    type="email"
                    value={editForm.client_email}
                    onChange={(e) => setEditForm({ ...editForm, client_email: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">T\u00e9l\u00e9phone</label>
                  <input
                    type="tel"
                    value={editForm.client_phone}
                    onChange={(e) => setEditForm({ ...editForm, client_phone: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de d\u00e9but</label>
                  <input
                    type="date"
                    value={editForm.start_date}
                    onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date de fin estim\u00e9e</label>
                  <input
                    type="date"
                    value={editForm.estimated_end_date}
                    onChange={(e) => setEditForm({ ...editForm, estimated_end_date: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-5 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium border rounded-md hover:bg-accent transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveProjectEdits}
                disabled={saving || !editForm.name.trim() || !editForm.address.trim() || !editForm.client_name.trim()}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
