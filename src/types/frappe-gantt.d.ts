declare module "frappe-gantt" {
  export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    color?: string;
    custom_class?: string;
    [key: string]: unknown;
  }

  export interface GanttPopupContext {
    set_title: (title: string) => void;
    set_subtitle: (subtitle: string) => void;
    set_details: (details: string) => void;
    task: GanttTask & { _start: Date; _end: Date; actual_duration: number; ignored_duration: number };
    chart: { options: GanttOptions };
  }

  export interface GanttOptions {
    view_mode?: "Quarter Day" | "Half Day" | "Day" | "Week" | "Month" | "Year";
    language?: string;
    custom_popup_html?: (task: { name: string; progress: number }) => string;
    popup?: false | ((ctx: GanttPopupContext) => void);
    popup_on?: "click" | "hover";
    on_click?: (task: GanttTask) => void;
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: GanttTask, progress: number) => void;
    on_view_change?: (mode: string) => void;
    readonly?: boolean;
    readonly_dates?: boolean;
    readonly_progress?: boolean;
    bar_height?: number;
    bar_corner_radius?: number;
    move_dependencies?: boolean;
    today_button?: boolean;
    scroll_to?: string;
    [key: string]: unknown;
  }

  export default class Gantt {
    constructor(
      element: HTMLElement | string,
      tasks: GanttTask[],
      options?: GanttOptions
    );
    change_view_mode(mode?: string, maintain_pos?: boolean): void;
    refresh(tasks: GanttTask[]): void;
    update_task(id: string, new_details: Partial<GanttTask>): void;
  }
}
