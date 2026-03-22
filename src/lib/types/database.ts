export type ProjectStatus = "active" | "completed" | "archived";
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Project {
  id: string;
  name: string;
  address: string;
  client_name: string;
  client_email: string | null;
  status: ProjectStatus;
  portal_token: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
      task_status: TaskStatus;
    };
  };
};
