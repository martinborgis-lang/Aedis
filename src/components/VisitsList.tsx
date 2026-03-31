"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Visit,
  VisitAttendee,
  VisitPhase,
  AttendeeStatus,
  ArtisanToken,
  VISIT_PHASE_LABELS,
  VISIT_PHASE_COLORS,
  ATTENDEE_STATUS_LABELS,
  ATTENDEE_STATUS_COLORS,
} from "@/lib/types/database";
import {
  Plus,
  Calendar,
  Users,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VisitsListProps {
  projectId: string;
  projectName?: string;
  isDemo?: boolean;
  artisanTokens?: ArtisanToken[];
}

interface VisitWithAttendees extends Visit {
  attendees: VisitAttendee[];
}

export const VisitsList: React.FC<VisitsListProps> = ({
  projectId,
  projectName,
  isDemo = false,
  artisanTokens = [],
}) => {
  const [visits, setVisits] = useState<VisitWithAttendees[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithAttendees | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newVisit, setNewVisit] = useState({
    date: new Date().toISOString().split('T')[0],
    object: "",
    phase: "suivi" as VisitPhase,
    zone: "",
    notes: "",
  });

  const [attendees, setAttendees] = useState<Omit<VisitAttendee, "id" | "visit_id" | "created_at">[]>([]);
  const [newAttendee, setNewAttendee] = useState({
    name: "",
    company: "",
    role: "",
  });

  const supabase = createClient();

  const fetchVisits = useCallback(async () => {
    if (isDemo) {
      // Demo data
      setVisits([
        {
          id: "demo-visit-1",
          project_id: projectId,
          user_id: "demo",
          date: "2024-03-15",
          object: "Visite de suivi mensuelle",
          phase: "suivi",
          zone: "RDC",
          notes: "Bonne progression des travaux de plomberie",
          created_at: "2024-03-15T10:00:00Z",
          attendees: [
            {
              id: "demo-attendee-1",
              visit_id: "demo-visit-1",
              name: "Jean Dupont",
              company: "Plomberie Dupont",
              role: "Plombier",
              status: "present",
              penalty: false,
              created_at: "2024-03-15T10:00:00Z",
            },
            {
              id: "demo-attendee-2",
              visit_id: "demo-visit-1",
              name: "Marie Martin",
              company: "Électricité Martin",
              role: "Électricien",
              status: "excuse",
              penalty: false,
              created_at: "2024-03-15T10:00:00Z",
            },
          ],
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      const { data: visitsData, error } = await supabase
        .from("visits")
        .select(`
          *,
          visit_attendees (*)
        `)
        .eq("project_id", projectId)
        .order("date", { ascending: false });

      if (error) throw error;

      type VisitData = Visit & { visit_attendees: VisitAttendee[] };
      const visitsWithAttendees: VisitWithAttendees[] = (visitsData as VisitData[] || []).map((visit) => ({
        ...visit,
        attendees: visit.visit_attendees || [],
      }));

      setVisits(visitsWithAttendees);
    } catch (error) {
      console.error("Error fetching visits:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, isDemo, supabase]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const resetForm = () => {
    setNewVisit({
      date: new Date().toISOString().split('T')[0],
      object: "",
      phase: "suivi",
      zone: "",
      notes: "",
    });
    setAttendees([]);
    setNewAttendee({ name: "", company: "", role: "" });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsEditing(false);
    setSelectedVisit(null);
    setShowDialog(true);
  };

  const openEditDialog = (visit: VisitWithAttendees) => {
    setNewVisit({
      date: visit.date,
      object: visit.object,
      phase: visit.phase,
      zone: visit.zone || "",
      notes: visit.notes || "",
    });
    setAttendees(visit.attendees.map(a => ({
      name: a.name,
      company: a.company,
      role: a.role,
      status: a.status,
      penalty: a.penalty,
    })));
    setSelectedVisit(visit);
    setIsEditing(true);
    setShowDialog(true);
  };

  const openDetailDialog = (visit: VisitWithAttendees) => {
    setSelectedVisit(visit);
    setShowDetailDialog(true);
  };

  const addAttendee = () => {
    if (!newAttendee.name.trim()) return;

    setAttendees([
      ...attendees,
      {
        name: newAttendee.name.trim(),
        company: newAttendee.company.trim() || null,
        role: newAttendee.role.trim() || null,
        status: "convoque",
        penalty: false,
      },
    ]);

    setNewAttendee({ name: "", company: "", role: "" });
  };

  const updateAttendeeStatus = (index: number, status: AttendeeStatus) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], status };
    setAttendees(updated);
  };

  const updateAttendeePenalty = (index: number, penalty: boolean) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], penalty };
    setAttendees(updated);
  };

  const removeAttendee = (index: number) => {
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const addArtisanAsAttendee = (artisanName: string) => {
    if (attendees.some(a => a.name === artisanName)) return;

    setAttendees([
      ...attendees,
      {
        name: artisanName,
        company: null,
        role: "Artisan",
        status: "convoque",
        penalty: false,
      },
    ]);
  };

  const saveVisit = async () => {
    if (!newVisit.object.trim() || isDemo) return;

    setSaving(true);
    try {
      const visitData = {
        project_id: projectId,
        user_id: "user-id", // TODO: get from auth
        date: newVisit.date,
        object: newVisit.object.trim(),
        phase: newVisit.phase,
        zone: newVisit.zone.trim() || null,
        notes: newVisit.notes.trim() || null,
      };

      let visitId: string;

      if (isEditing && selectedVisit) {
        // Update existing visit
        const { error: visitError } = await supabase
          .from("visits")
          .update(visitData)
          .eq("id", selectedVisit.id);

        if (visitError) throw visitError;

        // Delete existing attendees
        const { error: deleteError } = await supabase
          .from("visit_attendees")
          .delete()
          .eq("visit_id", selectedVisit.id);

        if (deleteError) throw deleteError;

        visitId = selectedVisit.id;
      } else {
        // Create new visit
        const { data, error: visitError } = await supabase
          .from("visits")
          .insert(visitData)
          .select()
          .single();

        if (visitError) throw visitError;
        visitId = data.id;

        // Log to activity feed
        try {
          await supabase.from('activity_feed').insert({
            project_id: projectId,
            project_name: projectName || 'Projet',
            type: 'visit_created',
            actor_name: 'Architecte',
            actor_type: 'architect',
            description: `Visite créée : "${newVisit.object}"`
          });
        } catch (err) {
          console.error('Error logging activity:', err);
        }
      }

      // Insert attendees
      if (attendees.length > 0) {
        const attendeesData = attendees.map(attendee => ({
          visit_id: visitId,
          name: attendee.name,
          company: attendee.company,
          role: attendee.role,
          status: attendee.status,
          penalty: attendee.penalty,
        }));

        const { error: attendeesError } = await supabase
          .from("visit_attendees")
          .insert(attendeesData);

        if (attendeesError) throw attendeesError;
      }

      await fetchVisits();
      setShowDialog(false);
      resetForm();
    } catch (error) {
      console.error("Error saving visit:", error);
    } finally {
      setSaving(false);
    }
  };

  const deleteVisit = async (visitId: string) => {
    if (!confirm("Supprimer cette visite ?") || isDemo) return;

    try {
      // Delete attendees first
      await supabase
        .from("visit_attendees")
        .delete()
        .eq("visit_id", visitId);

      // Delete visit
      const { error } = await supabase
        .from("visits")
        .delete()
        .eq("id", visitId);

      if (error) throw error;

      await fetchVisits();
      setShowDetailDialog(false);
    } catch (error) {
      console.error("Error deleting visit:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getPresenceSummary = (attendees: VisitAttendee[]) => {
    const present = attendees.filter(a => a.status === "present").length;
    const absent = attendees.filter(a => a.status === "absent" || a.status === "absent_non_excuse").length;
    const excuse = attendees.filter(a => a.status === "excuse").length;
    const convoque = attendees.filter(a => a.status === "convoque").length;

    const parts = [];
    if (present > 0) parts.push(`${present} présent${present > 1 ? "s" : ""}`);
    if (excuse > 0) parts.push(`${excuse} excusé${excuse > 1 ? "s" : ""}`);
    if (absent > 0) parts.push(`${absent} absent${absent > 1 ? "s" : ""}`);
    if (convoque > 0) parts.push(`${convoque} convoqué${convoque > 1 ? "s" : ""}`);

    return parts.join(", ");
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
          <h3 className="text-lg font-semibold">Visites</h3>
          <span className="text-xs text-muted-foreground">
            {visits.length} visite{visits.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button onClick={openCreateDialog} className="bg-accent hover:bg-accent/90 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle visite
        </Button>
      </div>

      {/* Visits List */}
      <div className="space-y-3">
        {visits.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Aucune visite pour ce projet
          </div>
        ) : (
          visits.map((visit) => (
            <Card
              key={visit.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openDetailDialog(visit)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatDate(visit.date)}</span>
                      <Badge
                        style={{
                          backgroundColor: VISIT_PHASE_COLORS[visit.phase] + "20",
                          color: VISIT_PHASE_COLORS[visit.phase],
                          borderColor: VISIT_PHASE_COLORS[visit.phase] + "30"
                        }}
                        variant="outline"
                      >
                        {VISIT_PHASE_LABELS[visit.phase]}
                      </Badge>
                    </div>
                    <h4 className="font-semibold">{visit.object}</h4>
                    {visit.zone && (
                      <p className="text-sm text-muted-foreground">Zone: {visit.zone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(visit);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{visit.attendees.length} participant{visit.attendees.length !== 1 ? "s" : ""}</span>
                  </div>
                  {visit.attendees.length > 0 && (
                    <span>{getPresenceSummary(visit.attendees)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier la visite" : "Nouvelle visite"}
            </DialogTitle>
            <DialogDescription>
              {isEditing ? "Modifiez les détails de la visite" : "Créez une nouvelle visite de chantier"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Visit Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={newVisit.date}
                  onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phase">Phase</Label>
                <Select
                  value={newVisit.phase}
                  onValueChange={(value: VisitPhase) => setNewVisit({ ...newVisit, phase: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suivi">Suivi de chantier</SelectItem>
                    <SelectItem value="opr">OPR</SelectItem>
                    <SelectItem value="reception">Réception</SelectItem>
                    <SelectItem value="livraison">Livraison</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="object">Objet *</Label>
                <Input
                  id="object"
                  placeholder="Objet de la visite"
                  value={newVisit.object}
                  onChange={(e) => setNewVisit({ ...newVisit, object: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="zone">Zone</Label>
                <Input
                  id="zone"
                  placeholder="Zone du chantier"
                  value={newVisit.zone}
                  onChange={(e) => setNewVisit({ ...newVisit, zone: e.target.value })}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notes de la visite"
                  value={newVisit.notes}
                  onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>

            {/* Participants */}
            <div className="space-y-4">
              <h4 className="font-semibold">Participants</h4>

              {/* Artisans disponibles */}
              {getArtisanNames().length > 0 && (
                <div className="space-y-2">
                  <Label>Ajouter depuis les artisans du projet</Label>
                  <div className="flex flex-wrap gap-2">
                    {getArtisanNames().map((name) => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        onClick={() => addArtisanAsAttendee(name)}
                        disabled={attendees.some(a => a.name === name)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new attendee */}
              <div className="border rounded-lg p-4 space-y-3">
                <Label>Ajouter un participant</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Input
                    placeholder="Nom"
                    value={newAttendee.name}
                    onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                  />
                  <Input
                    placeholder="Entreprise"
                    value={newAttendee.company}
                    onChange={(e) => setNewAttendee({ ...newAttendee, company: e.target.value })}
                  />
                  <Input
                    placeholder="Rôle"
                    value={newAttendee.role}
                    onChange={(e) => setNewAttendee({ ...newAttendee, role: e.target.value })}
                  />
                  <Button onClick={addAttendee} disabled={!newAttendee.name.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Attendees table */}
              {attendees.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Pénalité</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendees.map((attendee, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{attendee.name}</TableCell>
                          <TableCell>{attendee.company || "-"}</TableCell>
                          <TableCell>{attendee.role || "-"}</TableCell>
                          <TableCell>
                            <Select
                              value={attendee.status}
                              onValueChange={(value: AttendeeStatus) => updateAttendeeStatus(index, value)}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="convoque">Convoqué</SelectItem>
                                <SelectItem value="present">Présent</SelectItem>
                                <SelectItem value="absent">Absent</SelectItem>
                                <SelectItem value="excuse">Excusé</SelectItem>
                                <SelectItem value="absent_non_excuse">Absent non excusé</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={attendee.penalty}
                              onChange={(e) => updateAttendeePenalty(index, e.target.checked)}
                              className="rounded"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttendee(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button
                onClick={saveVisit}
                disabled={!newVisit.object.trim() || saving}
                className="bg-accent hover:bg-accent/90"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          {selectedVisit && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle>{selectedVisit.object}</DialogTitle>
                    <DialogDescription>
                      {formatDate(selectedVisit.date)}
                    </DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: VISIT_PHASE_COLORS[selectedVisit.phase] + "20",
                        color: VISIT_PHASE_COLORS[selectedVisit.phase],
                        borderColor: VISIT_PHASE_COLORS[selectedVisit.phase] + "30"
                      }}
                      variant="outline"
                    >
                      {VISIT_PHASE_LABELS[selectedVisit.phase]}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {selectedVisit.zone && (
                  <div>
                    <h4 className="font-semibold mb-2">Zone</h4>
                    <p className="text-muted-foreground">{selectedVisit.zone}</p>
                  </div>
                )}

                {selectedVisit.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notes</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedVisit.notes}</p>
                  </div>
                )}

                {/* Attendance Summary */}
                <div>
                  <h4 className="font-semibold mb-2">Résumé des présences</h4>
                  <p className="text-muted-foreground">{getPresenceSummary(selectedVisit.attendees)}</p>
                </div>

                {/* Participants */}
                <div>
                  <h4 className="font-semibold mb-2">Participants ({selectedVisit.attendees.length})</h4>
                  <div className="space-y-2">
                    {selectedVisit.attendees.map((attendee) => (
                      <div key={attendee.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{attendee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {[attendee.company, attendee.role].filter(Boolean).join(" • ")}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            style={{
                              backgroundColor: ATTENDEE_STATUS_COLORS[attendee.status] + "20",
                              color: ATTENDEE_STATUS_COLORS[attendee.status],
                              borderColor: ATTENDEE_STATUS_COLORS[attendee.status] + "30"
                            }}
                            variant="outline"
                          >
                            {ATTENDEE_STATUS_LABELS[attendee.status]}
                          </Badge>
                          {attendee.penalty && (
                            <Badge variant="destructive">Pénalité</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between">
                  <Button
                    variant="destructive"
                    onClick={() => deleteVisit(selectedVisit.id)}
                    disabled={isDemo}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                      Fermer
                    </Button>
                    <Button
                      onClick={() => {
                        setShowDetailDialog(false);
                        openEditDialog(selectedVisit);
                      }}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};