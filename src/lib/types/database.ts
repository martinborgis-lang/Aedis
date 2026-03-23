export type ProjectStatus = "active" | "completed" | "archived";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type ReservePriority = "low" | "medium" | "high" | "critical";
export type ReserveStatus = "open" | "in_progress" | "resolved";

export interface Project {
  id: string;
  name: string;
  address: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  description: string | null;
  start_date: string | null;
  estimated_end_date: string | null;
  status: ProjectStatus;
  portal_token: string;
  portal_enabled: boolean;
  model_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export type Trade =
  | "gros-oeuvre"
  | "charpente"
  | "couverture"
  | "plomberie"
  | "electricite"
  | "menuiserie"
  | "peinture"
  | "carrelage"
  | "platrerie"
  | "maconnerie"
  | "terrassement"
  | "isolation"
  | "chauffage"
  | "autre";

export const TRADE_LABELS: Record<Trade, string> = {
  "gros-oeuvre": "Gros \u0153uvre",
  charpente: "Charpente",
  couverture: "Couverture",
  plomberie: "Plomberie",
  electricite: "\u00c9lectricit\u00e9",
  menuiserie: "Menuiserie",
  peinture: "Peinture",
  carrelage: "Carrelage",
  platrerie: "Pl\u00e2trerie",
  maconnerie: "Ma\u00e7onnerie",
  terrassement: "Terrassement",
  isolation: "Isolation",
  chauffage: "Chauffage",
  autre: "Autre",
};

export const TRADE_COLORS: Record<Trade, string> = {
  "gros-oeuvre": "#6366f1",
  charpente: "#8b5cf6",
  couverture: "#d946ef",
  plomberie: "#3b82f6",
  electricite: "#f59e0b",
  menuiserie: "#84cc16",
  peinture: "#ec4899",
  carrelage: "#14b8a6",
  platrerie: "#f97316",
  maconnerie: "#78716c",
  terrassement: "#a16207",
  isolation: "#06b6d4",
  chauffage: "#ef4444",
  autre: "#6b7280",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#10b981",
};

export const RESERVE_PRIORITY_COLORS: Record<ReservePriority, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#dc2626",
};

export const RESERVE_PRIORITY_LABELS: Record<ReservePriority, string> = {
  low: "Faible",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

export const RESERVE_STATUS_COLORS: Record<ReserveStatus, string> = {
  open: "#f59e0b",
  in_progress: "#3b82f6",
  resolved: "#10b981",
};

export const RESERVE_STATUS_LABELS: Record<ReserveStatus, string> = {
  open: "Ouverte",
  in_progress: "En cours",
  resolved: "Résolue",
};

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  progress: number;
  sort_order: number;
  trade: Trade | null;
  dependencies: string[];
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  task_id: string;
  project_id: string;
  url: string;
  caption: string | null;
  created_at: string;
  uploaded_by: string | null;
}

export interface ArtisanToken {
  id: string;
  project_id: string;
  task_id: string;
  artisan_name: string;
  token: string;
  created_at: string;
}

export interface Reserve {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  photo_url: string | null;
  assigned_to: string | null;
  priority: ReservePriority;
  status: ReserveStatus;
  created_at: string;
  resolved_at: string | null;
  resolution_photo_url: string | null;
  resolution_notes: string | null;
}

export interface Report {
  id: string;
  project_id: string;
  pdf_url: string;
  notes: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      photos: {
        Row: Photo;
        Insert: Omit<Photo, "id" | "created_at">;
        Update: Partial<Omit<Photo, "id" | "created_at">>;
      };
      artisan_tokens: {
        Row: ArtisanToken;
        Insert: Omit<ArtisanToken, "id" | "created_at">;
        Update: Partial<Omit<ArtisanToken, "id" | "created_at">>;
      };
      reserves: {
        Row: Reserve;
        Insert: Omit<Reserve, "id" | "created_at" | "resolved_at">;
        Update: Partial<Omit<Reserve, "id" | "created_at">>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at">;
        Update: Partial<Omit<Report, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
      task_status: TaskStatus;
      reserve_priority: ReservePriority;
      reserve_status: ReserveStatus;
    };
  };
};
