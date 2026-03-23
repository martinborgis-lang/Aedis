"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import { Project, Task, Photo } from "@/lib/types/database";
import { TRADE_LABELS } from "@/lib/types/database";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
  },
  header: {
    marginBottom: 30,
    borderBottom: 2,
    borderBottomColor: "#E8650A",
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    color: "#888888",
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 12,
    paddingBottom: 4,
    borderBottom: 1,
    borderBottomColor: "#E8650A",
  },
  projectInfo: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 4,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: "#666666",
    width: 100,
    marginRight: 10,
  },
  infoValue: {
    fontSize: 10,
    color: "#1a1a1a",
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: "#F8F9FA",
    padding: 15,
    borderRadius: 4,
    width: "30%",
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 600,
    color: "#E8650A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: "#666666",
    textAlign: "center",
  },
  taskItem: {
    flexDirection: "row",
    padding: 12,
    marginBottom: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 4,
    borderLeft: 4,
    borderLeftColor: "#E8650A",
  },
  taskMain: {
    flex: 1,
    marginRight: 15,
  },
  taskName: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 6,
  },
  taskDates: {
    fontSize: 9,
    color: "#888888",
    marginBottom: 4,
  },
  taskTrade: {
    fontSize: 9,
    color: "#E8650A",
    fontWeight: 600,
  },
  taskStatus: {
    alignItems: "flex-end",
    width: 80,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
  },
  statusInProgress: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
  },
  statusCompleted: {
    backgroundColor: "#D1FAE5",
    color: "#065F46",
  },
  statusText: {
    fontSize: 8,
    fontWeight: 600,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#E8650A",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    fontWeight: 600,
    color: "#E8650A",
    textAlign: "center",
  },
  timelineSection: {
    marginTop: 20,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8650A",
    marginRight: 12,
  },
  timelineDate: {
    fontSize: 10,
    fontWeight: 600,
    color: "#666666",
    width: 80,
    marginRight: 15,
  },
  timelineText: {
    fontSize: 10,
    color: "#1a1a1a",
    flex: 1,
  },
  photosSection: {
    marginTop: 25,
  },
  photoCount: {
    fontSize: 10,
    color: "#666666",
    fontStyle: "italic",
  },
  notesSection: {
    marginTop: 25,
    padding: 15,
    backgroundColor: "#F8F9FA",
    borderRadius: 4,
    borderLeft: 4,
    borderLeftColor: "#E8650A",
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#1a1a1a",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 10,
    color: "#666666",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#888888",
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: "#E5E5E5",
  },
});

interface ProjectPDFReportProps {
  project: Project;
  tasks: Task[];
  allPhotos: Record<string, Photo[]>;
  notes?: string;
}

const ProjectPDFDocument: React.FC<ProjectPDFReportProps> = ({
  project,
  tasks,
  allPhotos,
  notes = ""
}) => {
  const completedTasks = tasks.filter(t => t.status === "completed");

  const totalProgress = tasks.length > 0
    ? Math.round(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length)
    : 0;

  const totalPhotos = Object.values(allPhotos).reduce((sum, photos) => sum + photos.length, 0);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "in_progress":
        return styles.statusInProgress;
      case "completed":
        return styles.statusCompleted;
      default:
        return styles.statusPending;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "En attente";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminé";
      default:
        return "En attente";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      return new Date(dateString + "T00:00:00").toLocaleDateString("fr-FR");
    } catch {
      return "-";
    }
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Rapport de Projet</Text>
          <Text style={styles.subtitle}>{project.name || ''}</Text>
          <Text style={styles.date}>
            Généré le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>

        {/* Project Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du Projet</Text>
          <View style={styles.projectInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Client :</Text>
              <Text style={styles.infoValue}>{project.client_name || ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adresse :</Text>
              <Text style={styles.infoValue}>{project.address || ''}</Text>
            </View>
            {project.client_email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email :</Text>
                <Text style={styles.infoValue}>{project.client_email || ''}</Text>
              </View>
            )}
            {project.client_phone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Téléphone :</Text>
                <Text style={styles.infoValue}>{project.client_phone || ''}</Text>
              </View>
            )}
            {project.start_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Début :</Text>
                <Text style={styles.infoValue}>{formatDate(project.start_date) || ''}</Text>
              </View>
            )}
            {project.estimated_end_date && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fin estimée :</Text>
                <Text style={styles.infoValue}>{formatDate(project.estimated_end_date) || ''}</Text>
              </View>
            )}
            {project.description && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description :</Text>
                <Text style={styles.infoValue}>{project.description || ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Project Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques du Projet</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{`${totalProgress}%`}</Text>
              <Text style={styles.statLabel}>Avancement global</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{`${completedTasks.length}`}</Text>
              <Text style={styles.statLabel}>Tâches terminées</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{`${totalPhotos}`}</Text>
              <Text style={styles.statLabel}>Photos ajoutées</Text>
            </View>
          </View>
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{`Détail des Tâches (${tasks.length})`}</Text>
          {tasks
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((task) => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskMain}>
                  <Text style={styles.taskName}>{task.name || ''}</Text>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description || ''}</Text>
                  )}
                  <Text style={styles.taskDates}>
                    {formatDate(task.start_date) || ''} → {formatDate(task.end_date) || ''}
                  </Text>
                  {task.trade && (
                    <Text style={styles.taskTrade}>
                      {TRADE_LABELS[task.trade] || task.trade || ''}
                    </Text>
                  )}
                  {allPhotos[task.id] && allPhotos[task.id].length > 0 && (
                    <Text style={styles.photoCount}>
                      {`${allPhotos[task.id].length} photo${allPhotos[task.id].length > 1 ? "s" : ""}`}
                    </Text>
                  )}
                </View>
                <View style={styles.taskStatus}>
                  <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
                    <Text style={styles.statusText}>{getStatusLabel(task.status)}</Text>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${task.progress || 0}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{`${task.progress || 0}%`}</Text>
                </View>
              </View>
            ))}
        </View>

        {/* Timeline Section */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Chronologie du Projet</Text>
          {tasks
            .filter(task => task.start_date)
            .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
            .map((task) => (
              <View key={task.id} style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <Text style={styles.timelineDate}>{formatDate(task.start_date)}</Text>
                <Text style={styles.timelineText}>
                  {`Début de "${task.name || ''}"` +
                   (task.status === "completed" ? " (Terminée)" : "") +
                   (task.status === "in_progress" ? ` (${task.progress || 0}%)` : "")}
                </Text>
              </View>
            ))}
        </View>

        {/* Notes Section */}
        {notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes du Rapport</Text>
            <Text style={styles.notesText}>{notes || ''}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Aedis - Plateforme de gestion de projets architecturaux{"\n"}Rapport généré automatiquement le {new Date().toLocaleDateString("fr-FR")}
        </Text>
      </Page>
    </Document>
  );
};

export const generateProjectPDF = async (
  project: Project,
  tasks: Task[],
  allPhotos: Record<string, Photo[]>,
  notes?: string
) => {
  const blob = await pdf(
    <ProjectPDFDocument
      project={project}
      tasks={tasks}
      allPhotos={allPhotos}
      notes={notes}
    />
  ).toBlob();
  return blob;
};

export default ProjectPDFDocument;