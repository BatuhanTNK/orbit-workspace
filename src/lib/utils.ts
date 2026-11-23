import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  differenceInCalendarDays,
  format,
  formatDistanceStrict,
  parseISO,
} from "date-fns";
import type { Issue, Member, Project } from "@/types/workspace";
import { PRIORITY_MAP, STATUS_MAP } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(
  isoString: string,
  referenceMs?: number | null
): string {
  try {
    const parsed = parseISO(isoString);
    if (!referenceMs) {
      return format(parsed, "MMM d");
    }
    return formatDistanceStrict(parsed, new Date(referenceMs), {
      addSuffix: true,
    });
  } catch {
    return "just now";
  }
}

export interface DueDateDisplay {
  label: string;
  tone: "overdue" | "soon" | "normal";
}

export function formatDueDate(
  dueDate: string | null,
  isDone = false,
  referenceMs?: number | null
): DueDateDisplay | null {
  if (!dueDate) return null;
  try {
    const parsed = parseISO(dueDate);
    if (isDone || !referenceMs) {
      return { label: format(parsed, "MMM d"), tone: "normal" };
    }
    const diff = differenceInCalendarDays(parsed, new Date(referenceMs));

    if (diff < 0) {
      return {
        label: diff === -1 ? "1d overdue" : `${Math.abs(diff)}d overdue`,
        tone: "overdue",
      };
    }
    if (diff === 0) {
      return { label: "Due today", tone: "soon" };
    }
    if (diff === 1) {
      return { label: "Tomorrow", tone: "soon" };
    }
    if (diff <= 4) {
      return { label: `In ${diff}d`, tone: "normal" };
    }
    return { label: format(parsed, "MMM d"), tone: "normal" };
  } catch {
    return null;
  }
}

export function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportIssuesToCSV(
  issues: Issue[],
  projects: Project[],
  members: Member[]
): void {
  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const memberMap = new Map(members.map((m) => [m.id, m.name]));

  const headers = [
    "Identifier",
    "Title",
    "Project",
    "Status",
    "Priority",
    "Assignee",
    "Labels",
    "Estimate",
    "Due Date",
    "Subtasks Done",
    "Updated At",
  ];

  const rows = issues.map((issue) => {
    const doneCount = issue.subtasks.filter((s) => s.completed).length;
    return [
      issue.identifier,
      issue.title,
      projectMap.get(issue.projectId) ?? "",
      STATUS_MAP[issue.status].label,
      PRIORITY_MAP[issue.priority].label,
      issue.assigneeId ? (memberMap.get(issue.assigneeId) ?? "Unassigned") : "Unassigned",
      issue.labels.join(" | "),
      String(issue.estimate),
      issue.dueDate ?? "",
      `${doneCount}/${issue.subtasks.length}`,
      issue.updatedAt,
    ]
      .map(escapeCsvCell)
      .join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  downloadBlob(
    csvContent,
    `orbit-issues-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv;charset=utf-8;"
  );
}

export function exportWorkspaceToJSON(payload: unknown): void {
  const content = JSON.stringify(payload, null, 2);
  downloadBlob(
    content,
    `orbit-workspace-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json;charset=utf-8;"
  );
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
