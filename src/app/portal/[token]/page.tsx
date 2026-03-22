"use client";

import { createClient } from "@/lib/supabase/client";
import { Project, Task, Photo } from "@/lib/types/database";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        if (token?.startsWith("demo-")) {
          const demoProject: Project = {
            id: "demo-project-1",
            name: "Villa Moderne Marseille",
            address: "123 Avenue de la Corniche, 13007 Marseille",
            status: "active",
            client_name: "M. et Mme Dubois",
            client_email: null,
            portal_token: token,
            user_id: "demo",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const demoTasks: Task[] = [
            {
              id: "demo-task-1",
              project_id: "demo-project-1",
              name: "Fondations",
              description: "Coulage des fondations et élévation des murs",
              start_date: "2024-01-15",
              end_date: "2024-02-15",
              status: "completed",
              progress: 100,
              sort_order: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "demo-task-2",
              project_id: "demo-project-1",
              name: "Structure",
              description: "Montage de la charpente et pose de la toiture",
              start_date: "2024-02-16",
              end_date: "2024-03-30",
              status: "in_progress",
              progress: 65,
              sort_order: 2,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "demo-task-3",
              project_id: "demo-project-1",
              name: "Second œuvre",
              description: "Plomberie, électricité et cloisons",
              start_date: "2024-04-01",
              end_date: "2024-05-15",
              status: "pending",
              progress: 0,
              sort_order: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ];

          setProject(demoProject);
          setTasks(demoTasks);
          setPhotos({});
        } else {
          const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select("*")
            .eq("portal_token", token)
            .single();

          if (projectError || !projectData) {
            setError("Projet non trouvé");
            return;
          }

          setProject(projectData);

          const { data: tasksData } = await supabase
            .from("tasks")
            .select("*")
            .eq("project_id", projectData.id)
            .order("start_date");

          if (tasksData) {
            setTasks(tasksData);
          }

          const { data: photosData } = await supabase
            .from("photos")
            .select("*")
            .eq("project_id", projectData.id);

          if (photosData) {
            const photosByTask = photosData.reduce((acc: Record<string, Photo[]>, photo: Photo) => {
              if (!acc[photo.task_id]) {
                acc[photo.task_id] = [];
              }
              acc[photo.task_id].push(photo);
              return acc;
            }, {} as Record<string, Photo[]>);
            setPhotos(photosByTask);
          }
        }
      } catch {
        setError("Erreur lors du chargement du projet");
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleFileUpload = async (taskId: string, file: File) => {
    setUploadingTaskId(taskId);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(uploadData.path);

      const { data: photoData, error: photoError } = await supabase
        .from("photos")
        .insert({
          project_id: project!.id,
          task_id: taskId,
          url: urlData.publicUrl,
          caption: null,
          uploaded_by: "client",
        })
        .select()
        .single();

      if (photoError) throw photoError;

      if (photoData) {
        setPhotos((prev) => ({
          ...prev,
          [taskId]: [...(prev[taskId] || []), photoData],
        }));
      }
    } catch (err) {
      console.error("Error uploading photo:", err);
    } finally {
      setUploadingTaskId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const overallProgress =
    tasks.length > 0
      ? Math.round(
          tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length
        )
      : 0;

  const completedTasks = tasks.filter((task) => task.status === "completed");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Projet non trouvé
          </h1>
          <p className="text-gray-600">
            Veuillez vérifier que le lien est correct.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {token?.startsWith("demo-") && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
          <p className="text-center text-yellow-800 font-medium">
            Mode démonstration
          </p>
        </div>
      )}

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Aedis</h1>
                <p className="text-sm text-gray-600">Portail Client</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {project.name}
              </h2>
              <p className="text-gray-600 mt-1">{project.address}</p>
              {project.client_name && (
                <p className="text-sm text-gray-500 mt-1">
                  Client: {project.client_name}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                project.status
              )}`}
            >
              {project.status === "completed"
                ? "Terminé"
                : project.status === "archived"
                ? "Archivé"
                : "Actif"}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Avancement global
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression</span>
                <span>{overallProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {tasks.length}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {completedTasks.length}
                </div>
                <div className="text-sm text-gray-600">Terminées</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {inProgressTasks.length}
                </div>
                <div className="text-sm text-gray-600">En cours</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Avancement des travaux
          </h3>
          <div className="space-y-6">
            {tasks.map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3 mb-4">
                  {getStatusIcon(task.status)}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{task.name}</h4>
                    {task.description && (
                      <p className="text-gray-600 text-sm mt-1">
                        {task.description}
                      </p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      {task.start_date} - {task.end_date}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progression</span>
                    <span>{task.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                </div>

                {photos[task.id] && photos[task.id].length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Camera className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Photos</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {photos[task.id].map((photo) => (
                        <div
                          key={photo.id}
                          className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt="Photo du projet"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id={`upload-${task.id}`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(task.id, file);
                      }
                    }}
                  />
                  <label
                    htmlFor={`upload-${task.id}`}
                    className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    {uploadingTaskId === task.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span className="text-sm">Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">Ajouter une photo</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Propulsé par Aedis</p>
            <p className="text-gray-400 text-xs mt-1">
              Plateforme de suivi de chantier
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}