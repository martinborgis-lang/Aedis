"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Reserve,
  ReservePriority,
  ReserveStatus,
  ReserveStatusHistory,
  Visit,
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
  MapPin,
  FileText,
  History,
  Eye,
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
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<Reserve | null>(null);
  const [statusHistory, setStatusHistory] = useState<ReserveStatusHistory[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReserveStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<ReservePriority | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "observation" | "remarque">("all");
  const [visitFilter, setVisitFilter] = useState<string>("all");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [newReserve, setNewReserve] = useState({
    title: "",
    description: "",
    assigned_to: "",
    priority: "medium" as ReservePriority,
    type: "observation" as "observation" | "remarque",
    chapter: "",
    sub_chapter: "",
    visit_id: "",
  });
  const [reservePhoto, setReservePhoto] = useState<File | null>(null);

  const supabase = createClient();

  const fetchVisits = useCallback(async () => {
    if (isDemo) {
      setVisits([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("visits")
        .select("id, date, object, project_id, user_id, phase, zone, notes, created_at")
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      setVisits(data || []);
    } catch (error) {
      console.error("Error fetching visits:", error);
    }
  }, [projectId, isDemo, supabase]);

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
          status: "urgent",
          created_at: "2024-03-15T10:00:00Z",
          resolved_at: null,
          resolution_photo_url: null,
          resolution_notes: null,
          // MODULE 2 - nouveaux champs
          visit_id: null,
          number: "R-001",
          type: "observation",
          chapter: null,
          sub_chapter: null,
          plan_id: null,
          plan_x: null,
          plan_y: null,
          resolved_note: null,
        },
        {
          id: "demo-reserve-2",
          project_id: projectId,
          title: "Point réunion carrelage",
          description: "Carrelage non conforme aux spécifications techniques",
          photo_url: null,
          assigned_to: "Marie Martin",
          priority: "low",
          status: "resolved",
          created_at: "2024-03-10T09:00:00Z",
          resolved_at: "2024-03-12T14:30:00Z",
          resolution_photo_url: null,
          resolution_notes: "Carrelage remplacé",
          // MODULE 2 - nouveaux champs
          visit_id: null,
          number: "R-002",
          type: "remarque",
          chapter: "Sol - Revêtements",
          sub_chapter: "Carrelage cuisine",
          plan_id: null,
          plan_x: null,
          plan_y: null,
          resolved_note: "Solution trouvée en réunion",
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
    fetchVisits();
  }, [fetchReserves, fetchVisits]);

  const handlePhotoUpload = async (files: File[]) => {
    if (files.length > 0) {
      setReservePhoto(files[0]);
    }
  };

  const calculateReserveNumber = async (): Promise<string> => {
    if (isDemo) return `R-${String(reserves.length + 1).padStart(3, '0')}`;

    try {
      const { data } = await supabase
        .from("reserves")
        .select("id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      const nextNumber = (data?.length || 0) + 1;
      return `R-${String(nextNumber).padStart(3, '0')}`;
    } catch (error) {
      console.error("Error calculating reserve number:", error);
      return `R-${String(Date.now()).slice(-3)}`;
    }
  };

  const insertStatusHistory = async (reserveId: string, status: ReserveStatus) => {
    if (isDemo) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('reserve_status_history').insert({
        reserve_id: reserveId,
        status: status,
        note: null,
        changed_by: user?.id || null
      });
    } catch (error) {
      console.error("Error inserting status history:", error);
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

      // Calcul automatique du numéro
      const reserveNumber = await calculateReserveNumber();

      const { data, error } = await supabase
        .from("reserves")
        .insert({
          project_id: projectId,
          title: newReserve.title.trim(),
          description: newReserve.description.trim() || null,
          assigned_to: newReserve.assigned_to.trim() || null,
          priority: newReserve.priority,
          status: "open",
          photo_url: photoUrl,
          // MODULE 2 - nouveaux champs
          number: reserveNumber,
          type: newReserve.type,
          chapter: newReserve.type === "remarque" ? (newReserve.chapter.trim() || null) : null,
          sub_chapter: newReserve.type === "remarque" ? (newReserve.sub_chapter.trim() || null) : null,
          visit_id: newReserve.visit_id || null,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Insert initial status history
        await insertStatusHistory(data.id, "open");

        setReserves([data, ...reserves]);
        setNewReserve({
          title: "",
          description: "",
          assigned_to: "",
          priority: "medium",
          type: "observation",
          chapter: "",
          sub_chapter: "",
          visit_id: "",
        });
        setReservePhoto(null);
        setShowForm(false);

        // Log to activity feed
        try {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('activity_feed').insert({
            project_id: projectId,
            project_name: projectName || null,
            type: 'reserve_opened',
            actor_name: user?.email ?? 'Architecte',
            actor_type: 'architect',
            description: `Réserve ${reserveNumber} ouverte : "${data.title}"`,
            entity_id: data.id,
            entity_type: 'reserve'
          });
        } catch (err) {
          console.error('Error logging activity_feed:', err);
        }
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
      const updateData: any = { status };
      if (status === "resolved") {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("reserves")
        .update(updateData)
        .eq("id", reserveId);

      if (error) throw error;

      // Insert status history
      await insertStatusHistory(reserveId, status);

      // Log status change to activity feed
      try {
        const reserve = reserves.find(r => r.id === reserveId);
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('activity_feed').insert({
          project_id: projectId,
          project_name: projectName || null,
          type: 'reserve_status_changed',
          actor_name: user?.email ?? 'Architecte',
          actor_type: 'architect',
          description: `Réserve ${reserve?.number || ''} : statut → ${RESERVE_STATUS_LABELS[status]}`,
          entity_id: reserveId,
          entity_type: 'reserve'
        });
      } catch (err) {
        console.error('Error logging activity_feed:', err);
      }

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

  const fetchStatusHistory = async (reserveId: string) => {
    if (isDemo) {
      setStatusHistory([]);
      return;
    }

    try {
      const { data } = await supabase
        .from("reserve_status_history")
        .select("*")
        .eq("reserve_id", reserveId)
        .order("changed_at", { ascending: false });

      setStatusHistory(data || []);
    } catch (error) {
      console.error("Error fetching status history:", error);
      setStatusHistory([]);
    }
  };

  const openDetailModal = async (reserve: Reserve) => {
    setShowDetailModal(reserve);
    await fetchStatusHistory(reserve.id);
  };

  const getStatusIcon = (status: ReserveStatus) => {
    switch (status) {
      case "resolved":
      case "acte":
        return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress":
      case "programme":
        return <Clock className="h-4 w-4" />;
      case "urgent":
      case "en_retard":
        return <AlertTriangle className="h-4 w-4" />;
      case "open":
      case "a_surveiller":
      case "en_attente":
      case "clos":
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: "observation" | "remarque" | null) => {
    if (type === "remarque") {
      return <FileText className="h-4 w-4" />;
    }
    return <MapPin className="h-4 w-4" />;
  };

  const filteredReserves = reserves.filter((reserve) => {
    const statusMatch = statusFilter === "all" || reserve.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || reserve.priority === priorityFilter;
    const typeMatch = typeFilter === "all" ||
      (typeFilter === "observation" && (reserve.type === "observation" || !reserve.type)) ||
      (typeFilter === "remarque" && reserve.type === "remarque");
    const visitMatch = visitFilter === "all" ||
      (visitFilter === "none" && !reserve.visit_id) ||
      reserve.visit_id === visitFilter;

    return statusMatch && priorityMatch && typeMatch && visitMatch;
  });

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setTypeFilter("all");
    setVisitFilter("all");
  };

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
          <option value="open">Ouvert</option>
          <option value="urgent">Urgent</option>
          <option value="en_retard">En retard</option>
          <option value="a_surveiller">À surveiller</option>
          <option value="en_attente">En attente</option>
          <option value="programme">Programmé</option>
          <option value="in_progress">En cours</option>
          <option value="acte">Acté</option>
          <option value="resolved">Levé</option>
          <option value="clos">Clôturé</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as "all" | "observation" | "remarque")}
          className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">Tous types</option>
          <option value="observation">Observations</option>
          <option value="remarque">Remarques</option>
        </select>
        <select
          value={visitFilter}
          onChange={(e) => setVisitFilter(e.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
        >
          <option value="all">Toutes les visites</option>
          <option value="none">Aucune visite</option>
          {visits.map((visit) => (
            <option key={visit.id} value={visit.id}>
              {new Date(visit.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} — {visit.object}
            </option>
          ))}
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
        <button
          onClick={clearFilters}
          className="rounded-md border px-2 py-1 text-xs hover:bg-accent transition-colors"
        >
          Effacer
        </button>
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
            <div className="grid grid-cols-3 gap-3">
              <select
                value={newReserve.type}
                onChange={(e) => setNewReserve({ ...newReserve, type: e.target.value as "observation" | "remarque" })}
                className="rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <option value="observation">📍 Observation</option>
                <option value="remarque">📝 Remarque</option>
              </select>
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

            {/* Visite associée */}
            <div>
              <label className="block text-sm font-medium mb-1">Visite associée (optionnelle)</label>
              <select
                value={newReserve.visit_id}
                onChange={(e) => setNewReserve({ ...newReserve, visit_id: e.target.value })}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              >
                <option value="">Aucune visite</option>
                {visits.map((visit) => (
                  <option key={visit.id} value={visit.id}>
                    {new Date(visit.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })} — {visit.object}
                  </option>
                ))}
              </select>
            </div>

            {/* Champs pour remarques */}
            {newReserve.type === "remarque" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Chapitre</label>
                  <input
                    type="text"
                    placeholder="Ex: Sol - Revêtements"
                    value={newReserve.chapter}
                    onChange={(e) => setNewReserve({ ...newReserve, chapter: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sous-chapitre</label>
                  <input
                    type="text"
                    placeholder="Ex: Carrelage cuisine"
                    value={newReserve.sub_chapter}
                    onChange={(e) => setNewReserve({ ...newReserve, sub_chapter: e.target.value })}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
              </div>
            )}

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
                    {reserve.number && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {reserve.number}
                      </span>
                    )}
                    {getTypeIcon(reserve.type)}
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
                  {reserve.type === "remarque" && (reserve.chapter || reserve.sub_chapter) && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {reserve.chapter && <span className="font-medium">{reserve.chapter}</span>}
                      {reserve.chapter && reserve.sub_chapter && " › "}
                      {reserve.sub_chapter && <span>{reserve.sub_chapter}</span>}
                    </div>
                  )}
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
                  <button
                    onClick={() => openDetailModal(reserve)}
                    className="inline-flex items-center justify-center rounded-md h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Voir détails et historique"
                  >
                    <Eye className="h-3 w-3" />
                  </button>
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

              {reserve.status !== "resolved" && reserve.status !== "clos" && (
                <div className="flex gap-1">
                  <select
                    value={reserve.status}
                    onChange={(e) => updateReserveStatus(reserve.id, e.target.value as ReserveStatus)}
                    className="rounded-md border bg-background px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  >
                    <option value="open">Ouvert</option>
                    <option value="urgent">Urgent</option>
                    <option value="en_retard">En retard</option>
                    <option value="a_surveiller">À surveiller</option>
                    <option value="en_attente">En attente</option>
                    <option value="programme">Programmé</option>
                    <option value="in_progress">En cours</option>
                    <option value="acte">Acté</option>
                    <option value="resolved">Levé</option>
                    <option value="clos">Clôturé</option>
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

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {showDetailModal.number && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-800">
                      {showDetailModal.number}
                    </span>
                  )}
                  {getTypeIcon(showDetailModal.type)}
                  <h2 className="text-lg font-semibold">{showDetailModal.title}</h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-sm font-medium ring-1 ring-inset"
                  style={{
                    backgroundColor: RESERVE_STATUS_COLORS[showDetailModal.status] + "20",
                    color: RESERVE_STATUS_COLORS[showDetailModal.status],
                    borderColor: RESERVE_STATUS_COLORS[showDetailModal.status] + "30",
                  }}
                >
                  {getStatusIcon(showDetailModal.status)}
                  {RESERVE_STATUS_LABELS[showDetailModal.status]}
                </span>
              </div>

              {/* Description */}
              {showDetailModal.description && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">{showDetailModal.description}</p>
                </div>
              )}

              {/* Chapter/Sub-chapter */}
              {showDetailModal.type === "remarque" && (showDetailModal.chapter || showDetailModal.sub_chapter) && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Classification</h3>
                  <p className="text-sm text-muted-foreground">
                    {showDetailModal.chapter && <span className="font-medium">{showDetailModal.chapter}</span>}
                    {showDetailModal.chapter && showDetailModal.sub_chapter && " › "}
                    {showDetailModal.sub_chapter && <span>{showDetailModal.sub_chapter}</span>}
                  </p>
                </div>
              )}

              {/* Assigned to */}
              {showDetailModal.assigned_to && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Assigné à</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {showDetailModal.assigned_to}
                  </p>
                </div>
              )}

              {/* Visit association */}
              {showDetailModal.visit_id && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Visite associée</h3>
                  <p className="text-sm text-muted-foreground">
                    {visits.find(v => v.id === showDetailModal.visit_id)?.object || 'Visite non trouvée'}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Date de création</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(showDetailModal.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
                {showDetailModal.resolved_at && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Date de résolution</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(showDetailModal.resolved_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Status History */}
              <div className="mb-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <History className="h-4 w-4" />
                  Historique des statuts
                </h3>
                {statusHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Aucun historique disponible</p>
                ) : (
                  <div className="space-y-2">
                    {statusHistory.map((history) => (
                      <div key={history.id} className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          {new Date(history.changed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          {" "}
                          {new Date(history.changed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: RESERVE_STATUS_COLORS[history.status] + "20",
                            color: RESERVE_STATUS_COLORS[history.status],
                          }}
                        >
                          {RESERVE_STATUS_LABELS[history.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution notes */}
              {showDetailModal.resolution_notes && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-1">Notes de résolution</h3>
                  <p className="text-sm text-muted-foreground">{showDetailModal.resolution_notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetailModal(null)}
                  className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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