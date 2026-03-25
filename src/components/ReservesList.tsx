"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Reserve,
  ReservePriority,
  ReserveStatus,
  RESERVE_PRIORITY_COLORS,
  RESERVE_PRIORITY_LABELS,
  RESERVE_STATUS_COLORS,
  RESERVE_STATUS_LABELS,
  ArtisanToken,
} from "@/lib/types/database";
import {
  Plus,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Trash2,
  User,
} from "lucide-react";
import { PhotoUpload } from "./PhotoUpload";
import { PhotoLightbox } from "./PhotoLightbox";

interface ReservesListProps {
  projectId: string;
  projectName?: string;
  isDemo?: boolean;
  artisanTokens?: ArtisanToken[];
}


export const ReservesList: React.FC<ReservesListProps> = ({
  projectId,
  projectName,
  isDemo = false,
  artisanTokens = [],
}) => {
  const [reserves, setReserves] = useState<Reserve[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReserveStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<ReservePriority | "all">("all");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newReserve, setNewReserve] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as ReservePriority,
  });
  const [reservePhoto, setReservePhoto] = useState<File | null>(null);

  const supabase = createClient();

  const fetchReserves = useCallback(async () => {
    if (isDemo) {
      // Demo data
      setReserves([
        {
          id: "demo-reserve-1",
          project_id: projectId,
          title: "Fissure mur salon",
          description: "Petite fissure apparue sur le mur du salon côté fenêtre",
          photo_url: null,
          assigned_to: "Jean Dupont",
          priority: "medium",
          status: "open",
          created_at: "2024-03-15T10:00:00Z",
          resolved_at: null,
          resolution_photo_url: null,
          resolution_notes: null,
        },
        {
          id: "demo-reserve-2",
          project_id: projectId,
          title: "Rayure carrelage",
          description: "Rayure visible sur le carrelage de la cuisine",
          photo_url: null,
          assigned_to: "Marie Martin",
          priority: "low",
          status: "resolved",
          created_at: "2024-03-10T09:00:00Z",
          resolved_at: "2024-03-12T14:30:00Z",
          resolution_photo_url: null,
          resolution_notes: "Carrelage remplacé",
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("reserves")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      setReserves(data || []);
    } catch (error) {
      console.error("Error fetching reserves:", error);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isDemo]);

  useEffect(() => {
    fetchReserves();
  }, [fetchReserves]);

  const handlePhotoUpload = async (files: File[]) => {
    if (files.length > 0) {
      setReservePhoto(files[0]);
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${projectId}/reserves/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("photos")
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading photo:", error);
      return null;
    }
  };

  const createReserve = async () => {
    if (!newReserve.title.trim() || isDemo) return;

    setSaving(true);
    try {
      let photoUrl: string | null = null;

      if (reservePhoto) {
        photoUrl = await uploadPhoto(reservePhoto);
      }

      const { data, error } = await supabase
        .from("reserves")
        .insert({
          project_id: projectId,
          title: newReserve.title.trim(),
          description: newReserve.description.trim() || null,
          assigned_to: newReserve.assigned_to.trim() || null,
          priority: newReserve.priority,
          photo_url: photoUrl,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setReserves([data, ...reserves]);
        setNewReserve({
          title: "",
          description: "",
          assigned_to: "",
          priority: "medium",
        });
        setReservePhoto(null);
        setShowForm(false);

        // Log to activity feed
        await supabase.from('activity_feed').insert({
          project_id: projectId,
          project_name: projectName || 'Projet',
          type: 'reserve_opened',
          actor_name: 'Architecte',
          actor_type: 'architect',
          description: `Réserve ouverte : "${data.title}"`
        }).catch(err => console.error('Error logging activity:', err));
      }
    } catch (error) {
      console.error("Error creating reserve:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateReserveStatus = async (reserveId: string, status: ReserveStatus) => {
    if (isDemo) {
      setReserves((prev) =>
        prev.map((r) =>
          r.id === reserveId
            ? {
                ...r,
                status,
                resolved_at: status === "resolved" ? new Date().toISOString() : null
              }
            : r
        )
      );
      return;
    }

    try {
      const { error } = await supabase
        .from("reserves")
        .update({ status })
        .eq("id", reserveId);

      if (error) throw error;

      setReserves((prev) =>
        prev.map((r) => (r.id === reserveId ? { ...r, status } : r))
      );
    } catch (error) {
      console.error("Error updating reserve status:", error);
    }
  };

  const deleteReserve = async (reserveId: string) => {
    if (!confirm("Supprimer cette réserve ?") || isDemo) return;

    try {
      const { error } = await supabase
        .from("reserves")
        .delete()
        .eq("id", reserveId);

      if (error) throw error;

      setReserves((prev) => prev.filter((r) => r.id !== reserveId));
    } catch (error) {
      console.error("Error deleting reserve:", error);
    }
  };

  const getStatusIcon = (status: ReserveStatus) => {
    switch (status) {
      case "resolved":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
        return <Clock className="h-4 w-4" />;
      case "open":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const filteredReserves = reserves.filter((reserve) => {
    const statusMatch = statusFilter === "all" || reserve.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || reserve.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const getArtisanNames = () => {
    const names = new Set(artisanTokens.map(token => token.artisan_name));
    return Array.from(names);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Réserves</h3>
          <span className="text-xs text-muted-foreground">
            {filteredReserves.length} réserve{filteredReserves.length !== 1 ? "s" : ""}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ReserveStatus | "all")}
          className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">Tous les statuts</option>
          <option value="open">Ouvertes</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolues</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as ReservePriority | "all")}
          className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">Toutes priorités</option>
          <option value="critical">Critique</option>
          <option value="high">Élevée</option>
          <option value="medium">Moyenne</option>
          <option value="low">Faible</option>
        </select>
      </div>

      {/* New Reserve Form */}
      {showForm && (
        <div className="rounded-lg border bg-muted/30 p-4">
          <h4 className="text-sm font-medium mb-3">Nouvelle réserve</h4>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Titre de la réserve"
              value={newReserve.title}
              onChange={(e) => setNewReserve({ ...newReserve, title: e.target.value })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
            <textarea
              placeholder="Description (optionnelle)"
              value={newReserve.description}
              onChange={(e) => setNewReserve({ ...newReserve, description: e.target.value })}
              rows={2}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newReserve.priority}
                onChange={(e) => setNewReserve({ ...newReserve, priority: e.target.value as ReservePriority })}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <option value="low">Faible</option>
                <option value="medium">Moyenne</option>
                <option value="high">Élevée</option>
                <option value="critical">Critique</option>
              </select>
              {getArtisanNames().length > 0 ? (
                <select
                  value={newReserve.assigned_to}
                  onChange={(e) => setNewReserve({ ...newReserve, assigned_to: e.target.value })}
                  className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                >
                  <option value="">Non assigné</option>
                  {getArtisanNames().map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Assigné à (optionnel)"
                  value={newReserve.assigned_to}
                  onChange={(e) => setNewReserve({ ...newReserve, assigned_to: e.target.value })}
                  className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              )}
            </div>

            {!isDemo && (
              <div>
                <PhotoUpload onUpload={handlePhotoUpload} className="mb-2" />
                {reservePhoto && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{reservePhoto.name}</span>
                    <button
                      onClick={() => setReservePhoto(null)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={createReserve}
                disabled={!newReserve.title.trim() || saving}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {saving ? "Création..." : "Créer"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reserves List */}
      <div className="space-y-3">
        {filteredReserves.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            {reserves.length === 0
              ? "Aucune réserve pour ce projet"
              : "Aucune réserve ne correspond aux filtres sélectionnés"}
          </div>
        ) : (
          filteredReserves.map((reserve) => (
            <div key={reserve.id} className="rounded-lg border p-4 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: RESERVE_PRIORITY_COLORS[reserve.priority] }}
                    />
                    <h4 className="text-sm font-medium">{reserve.title}</h4>
                  </div>
                  {reserve.description && (
                    <p className="text-xs text-muted-foreground mb-2">{reserve.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: RESERVE_PRIORITY_COLORS[reserve.priority] }}
                      />
                      {RESERVE_PRIORITY_LABELS[reserve.priority]}
                    </span>
                    {reserve.assigned_to && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {reserve.assigned_to}
                      </span>
                    )}
                    <span>{new Date(reserve.created_at).toLocaleDateString("fr-FR")}</span>
                    {reserve.resolved_at && (
                      <span>Résolue le {new Date(reserve.resolved_at).toLocaleDateString("fr-FR")}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                    style={{
                      backgroundColor: RESERVE_STATUS_COLORS[reserve.status] + "20",
                      color: RESERVE_STATUS_COLORS[reserve.status],
                      borderColor: RESERVE_STATUS_COLORS[reserve.status] + "30",
                    }}
                  >
                    {getStatusIcon(reserve.status)}
                    {RESERVE_STATUS_LABELS[reserve.status]}
                  </span>
                  {!isDemo && (
                    <button
                      onClick={() => deleteReserve(reserve.id)}
                      className="inline-flex items-center justify-center rounded-md h-6 w-6 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {reserve.photo_url && (
                <div className="mb-3">
                  <button
                    onClick={() => setLightboxPhoto(reserve.photo_url!)}
                    className="rounded-lg overflow-hidden border hover:border-primary transition-colors"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reserve.photo_url}
                      alt={reserve.title}
                      className="w-20 h-20 object-cover"
                    />
                  </button>
                </div>
              )}

              {reserve.status !== "resolved" && (
                <div className="flex gap-1">
                  <select
                    value={reserve.status}
                    onChange={(e) => updateReserveStatus(reserve.id, e.target.value as ReserveStatus)}
                    className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    <option value="open">Ouverte</option>
                    <option value="in_progress">En cours</option>
                    <option value="resolved">Résolue</option>
                  </select>
                </div>
              )}

              {reserve.resolution_notes && (
                <div className="mt-2 p-2 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    <strong>Résolution:</strong> {reserve.resolution_notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photos={[{ id: "temp", url: lightboxPhoto, caption: "Photo réserve", created_at: "", uploaded_by: "", task_id: "", project_id: "" }]}
          initialIndex={0}
          onClose={() => setLightboxPhoto(null)}
        />
      )}
    </div>
  );
};