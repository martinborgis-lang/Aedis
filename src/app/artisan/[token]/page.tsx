"use client";

import { createClient } from "@/lib/supabase/client";
import { Task, Photo, ArtisanToken } from "@/lib/types/database";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  Upload,
  X,
  Send,
} from "lucide-react";
import { PhotoLightbox } from "@/components/PhotoLightbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.heic,.heif";

export default function ArtisanPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [artisanToken, setArtisanToken] = useState<ArtisanToken | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxTask, setLightboxTask] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<Record<string, File[]>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState<string[]>([]);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const { data: tokenData, error: tokenError } = await supabase
        .from("artisan_tokens")
        .select("*")
        .eq("token", token)
        .single();

      if (tokenError || !tokenData) {
        setError("Lien artisan invalide");
        return;
      }

      setArtisanToken(tokenData);

      const { data: taskData } = await supabase
        .from("tasks")
        .select("*")
        .eq("id", tokenData.task_id)
        .single();

      if (taskData) {
        setTasks([taskData]);
      }

      const { data: photosData } = await supabase
        .from("photos")
        .select("*")
        .eq("task_id", tokenData.task_id)
        .order("created_at", { ascending: false });

      if (photosData) {
        setPhotos({ [tokenData.task_id]: photosData });
      }
    } catch {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token, fetchData]);

  const markTaskDone = async (taskId: string) => {
    if (!artisanToken) return;
    setUpdatingTask(taskId);

    try {
      await supabase
        .from("tasks")
        .update({ status: "completed", progress: 100 })
        .eq("id", taskId);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: "completed" as const, progress: 100 } : t
        )
      );
    } catch (err) {
      console.error("Error updating task:", err);
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleFilesSelected = (taskId: string, fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const errors: string[] = [];
    const valid: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: taille max 10 Mo`);
        continue;
      }
      const type = file.type.toLowerCase();
      const ext = file.name.toLowerCase().split(".").pop();
      if (!ACCEPTED_TYPES.includes(type) && !["jpg", "jpeg", "png", "heic", "heif"].includes(ext || "")) {
        errors.push(`${file.name}: format non support\u00e9`);
        continue;
      }
      valid.push(file);
    }

    setFileErrors(errors);
    if (valid.length > 0) {
      setStagedFiles((prev) => ({ ...prev, [taskId]: [...(prev[taskId] || []), ...valid] }));
      setUploadSuccess(null);
    }
  };

  const clearStagedFile = (taskId: string, index: number) => {
    setStagedFiles((prev) => ({
      ...prev,
      [taskId]: (prev[taskId] || []).filter((_, i) => i !== index),
    }));
  };

  const sendPhotos = async (taskId: string) => {
    if (!artisanToken) return;
    const files = stagedFiles[taskId];
    if (!files || files.length === 0) return;

    setUploading(taskId);
    const newPhotos: Photo[] = [];

    for (const file of files) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${artisanToken.project_id}/${taskId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("photos")
          .getPublicUrl(filePath);

        const { data: photoData, error: photoError } = await supabase
          .from("photos")
          .insert({
            project_id: artisanToken.project_id,
            task_id: taskId,
            url: urlData.publicUrl,
            caption: file.name,
            uploaded_by: artisanToken.artisan_name,
          })
          .select()
          .single();

        if (photoError) throw photoError;

        if (photoData) {
          newPhotos.push(photoData);
        }
      } catch (err) {
        console.error("Error uploading photo:", err);
      }
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => ({
        ...prev,
        [taskId]: [...newPhotos, ...(prev[taskId] || [])],
      }));
    }

    setStagedFiles((prev) => ({ ...prev, [taskId]: [] }));
    setUploading(null);
    setUploadSuccess(taskId);
    setTimeout(() => setUploadSuccess((prev) => (prev === taskId ? null : prev)), 4000);
  };

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "Termin\u00e9";
      case "in_progress": return "En cours";
      case "pending": return "En attente";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !artisanToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-1">Lien invalide</h1>
          <p className="text-sm text-muted-foreground">Veuillez v&eacute;rifier que le lien est correct.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex h-14 items-center px-6">
          <div className="flex items-center gap-2.5">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold tracking-tight text-primary">Aedis</span>
            <span className="text-xs text-muted-foreground">
              Artisan &mdash; {artisanToken.artisan_name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {getStatusIcon(task.status)}
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{task.name}</CardTitle>
                    {task.description && <CardDescription>{task.description}</CardDescription>}
                    <p className="text-xs text-muted-foreground">{task.start_date} &mdash; {task.end_date}</p>
                  </div>
                </div>
                <Badge
                  variant={task.status === "completed" ? "default" : task.status === "in_progress" ? "secondary" : "outline"}
                  className={
                    task.status === "completed" ? "bg-emerald-500 text-white" :
                    task.status === "in_progress" ? "bg-blue-500 text-white" :
                    "border-amber-500 text-amber-700"
                  }
                >
                  {getStatusLabel(task.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{task.progress}%</span>
                </div>
                <Progress value={task.progress} className="h-2" />
              </div>

              {task.status !== "completed" && (
                <Button
                  onClick={() => markTaskDone(task.id)}
                  disabled={updatingTask === task.id}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {updatingTask === task.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Mise &agrave; jour...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Marquer comme termin&eacute;
                    </>
                  )}
                </Button>
              )}

              {photos[task.id] && photos[task.id].length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Photos ({photos[task.id].length})</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {photos[task.id].map((photo, i) => (
                    <button
                      key={photo.id}
                      onClick={() => { setLightboxTask(task.id); setLightboxIndex(i); }}
                      className="aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.caption || "Photo"} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              )}

              <div>
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (e.dataTransfer.files.length > 0) handleFilesSelected(task.id, e.dataTransfer.files);
                }}
                onClick={() => {
                  const input = document.getElementById(`file-input-${task.id}`) as HTMLInputElement;
                  input?.click();
                }}
                className="rounded-lg border-2 border-dashed p-5 text-center cursor-pointer transition-all border-border hover:border-primary/40 hover:bg-accent/50"
              >
                <input
                  id={`file-input-${task.id}`}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS}
                  multiple
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesSelected(task.id, e.target.files);
                      e.target.value = "";
                    }
                  }}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="rounded-full bg-secondary p-2">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-sm text-muted-foreground">Glissez des photos ou cliquez</span>
                  <span className="text-xs text-muted-foreground/60">JPEG, PNG, HEIC &mdash; 10 Mo max</span>
                </div>
              </div>

              {fileErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {fileErrors.map((err, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              {(stagedFiles[task.id]?.length || 0) > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {stagedFiles[task.id].map((file, i) => (
                      <div key={i} className="flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-1 text-xs">
                        <span className="truncate max-w-[150px]">{file.name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); clearStagedFile(task.id, i); }}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => sendPhotos(task.id)}
                    disabled={uploading === task.id}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="lg"
                  >
                    {uploading === task.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent-foreground border-t-transparent mr-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer
                      </>
                    )}
                  </Button>
                </div>
              )}

              {uploadSuccess === task.id && (
                <div className="mt-3 flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Photo envoy&eacute;e
                </div>
              )}
              </div>
            </CardContent>
          </Card>
        ))}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Aucune t&acirc;che assign&eacute;e.
          </div>
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
