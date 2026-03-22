"use client";

import { useEffect, useRef } from "react";
import type { GanttTask, GanttOptions } from "frappe-gantt";

interface GanttChartProps {
  tasks: GanttTask[];
  options?: GanttOptions;
  className?: string;
}

// Since this is now properly used with next/dynamic + ssr: false,
// we can safely import Gantt directly without dynamic import
function GanttChart({ tasks, options, className = "" }: GanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instanceRef = useRef<any>(null);

  useEffect(() => {
    if (tasks.length === 0 || !containerRef.current) return;

    let cancelled = false;

    const init = async () => {
      // Import Gantt here to ensure it loads properly in the browser
      const { default: Gantt } = await import("frappe-gantt");

      if (cancelled || !containerRef.current) return;

      // Load CSS if not already present
      if (!document.getElementById("gantt-css")) {
        const link = document.createElement("link");
        link.id = "gantt-css";
        link.rel = "stylesheet";
        link.href = "/frappe-gantt.css";
        document.head.appendChild(link);
      }

      // Clear container and create new Gantt instance
      containerRef.current.innerHTML = "";
      instanceRef.current = new Gantt(containerRef.current, tasks, options);
    };

    init().catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [tasks, options]);

  return <div ref={containerRef} className={className} />;
}

export default GanttChart;
