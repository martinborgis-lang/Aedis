"use client";

import { createClient } from "@/lib/supabase/client";
import { Project, Task, Photo } from "@/lib/types/database";
import { useState, useEffect } from "react";
import PascalViewer from "@/components/PascalViewer";
import { useParams } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxTask, setLightboxTask] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [sceneData, setSceneData] = useState<Record<string, unknown> | null>(null);

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
            client_phone: null,
            description: null,
            start_date: null,
            estimated_end_date: null,
            portal_token: token,
            portal_enabled: true,
            model_url: null,
            user_id: "demo",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const demoTasks: Task[] = [
            {
              id: "demo-task-1",
              project_id: "demo-project-1",
              name: "Fondations",
              description: "Coulage des fondations et \u00e9l\u00e9vation des murs",
              start_date: "2024-01-15",
              end_date: "2024-02-15",
              status: "completed",
              progress: 100,
              sort_order: 1,
              trade: null,
              dependencies: [],
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
              trade: null,
              dependencies: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              id: "demo-task-3",
              project_id: "demo-project-1",
              name: "Second \u0153uvre",
              description: "Plomberie, \u00e9lectricit\u00e9 et cloisons",
              start_date: "2024-04-01",
              end_date: "2024-05-15",
              status: "pending",
              progress: 0,
              sort_order: 3,
              trade: null,
              dependencies: [],
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
            setError("Projet non trouv\u00e9");
            return;
          }

          if (!projectData.portal_enabled) {
            setError("Ce portail n\u2019est pas activ\u00e9");
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

          if (projectData.model_url) {
            try {
              const modelRes = await fetch(projectData.model_url);
              const modelJson = await modelRes.json();
              setSceneData(modelJson);
            } catch (e) {
              console.error("Error loading 3D model:", e);
            }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "pending":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const overallProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((sum, task) => sum + task.progress, 0) / tasks.length)
      : 0;

  const completedTasks = tasks.filter((task) => task.status === "completed");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-1">Projet non trouv&eacute;</h1>
          <p className="text-sm text-muted-foreground">Veuillez v&eacute;rifier que le lien est correct.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {token?.startsWith("demo-") && (
        <div className="border-b bg-warning/5 px-4 py-2">
          <p className="text-center text-sm text-muted-foreground">Mode d&eacute;monstration</p>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex h-14 items-center px-6">
          <div className="flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-primary">Aedis</span>
            <span className="text-xs text-muted-foreground">Portail Client</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">{project.name}</CardTitle>
                <CardDescription className="text-base">{project.address}</CardDescription>
                {project.client_name && (
                  <p className="text-sm text-muted-foreground">Client: {project.client_name}</p>
                )}
              </div>
              <Badge
                variant={project.status === "completed" ? "default" : "secondary"}
                className={project.status === "completed" ? "bg-emerald-500 text-white" : "bg-accent text-accent-foreground"}
              >
                {project.status === "completed" ? "Termin\u00e9" : project.status === "archived" ? "Archiv\u00e9" : "Actif"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avancement global</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="rounded-full bg-accent/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <p className="text-xl font-bold text-accent">{tasks.length}</p>
                </div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center space-y-2">
                <div className="rounded-full bg-emerald-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <p className="text-xl font-bold text-emerald-600">{completedTasks.length}</p>
                </div>
                <p className="text-sm text-muted-foreground">Termin&eacute;es</p>
              </div>
              <div className="text-center space-y-2">
                <div className="rounded-full bg-blue-500/10 p-4 w-16 h-16 flex items-center justify-center mx-auto">
                  <p className="text-xl font-bold text-blue-600">{inProgressTasks.length}</p>
                </div>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avancement des travaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="border-l-4 border-l-accent/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-4">
                      {getStatusIcon(task.status)}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h4 className="text-base font-semibold">{task.name}</h4>
                        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                        <p className="text-xs text-muted-foreground">{task.start_date} — {task.end_date}</p>
                      </div>
                      <Badge
                        variant={task.status === "completed" ? "default" : task.status === "in_progress" ? "secondary" : "outline"}
                        className={task.status === "completed" ? "bg-emerald-500 text-white" : task.status === "in_progress" ? "bg-blue-500 text-white" : ""}
                      >
                        {task.status === "completed" ? "Terminé" : task.status === "in_progress" ? "En cours" : "En attente"}
                      </Badge>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="h-2" />
                    </div>

                    {photos[task.id] && photos[task.id].length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-muted-foreground">Photos ({photos[task.id].length})</p>
                        <div className="grid grid-cols-4 gap-3">
                          {photos[task.id].map((photo, i) => (
                            <button
                              key={photo.id}
                              onClick={() => { setLightboxTask(task.id); setLightboxIndex(i); }}
                              className="aspect-square rounded-lg overflow-hidden border-2 hover:border-accent transition-colors group"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photo.url}
                                alt={photo.caption || "Photo du projet"}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
        {project.model_url && sceneData && (
          <Card>
            <CardHeader>
              <CardTitle>Maquette 3D</CardTitle>
            </CardHeader>
            <CardContent>
              <PascalViewer
                sceneData={sceneData}
                height="500px"
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                Naviguez dans la maquette : cliquez et faites glisser pour pivoter, scroll pour zoomer
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <p className="text-center text-xs text-muted-foreground">Propuls&eacute; par Aedis</p>
        </div>
      </footer>

      {lightboxTask && photos[lightboxTask] && (
        <PhotoLightbox photos={photos[lightboxTask]} initialIndex={lightboxIndex} onClose={() => setLightboxTask(null)} />
      )}
    </div>
  );
}
