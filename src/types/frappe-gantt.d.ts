declare module "frappe-gantt" {
  interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
  }

  interface GanttOptions {
    view_mode?: "Quarter Day" | "Half Day" | "Day" | "Week" | "Month" | "Year";
    custom_popup_html?: (task: { name: string; progress: number }) => string;
  }

  export default class Gantt {
    constructor(
      element: HTMLElement | string,
      tasks: GanttTask[],
      options?: GanttOptions
    );
  }
}
