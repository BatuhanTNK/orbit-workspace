"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, CheckSquare, MessageSquare } from "lucide-react";
import type { Issue, Member, Project } from "@/types/workspace";
import { LABEL_MAP } from "@/lib/constants";
import { MemberAvatar, PriorityIcon } from "@/components/icons/issue-icons";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn, formatDueDate } from "@/lib/utils";

interface KanbanCardProps {
  issue: Issue;
  member: Member | undefined;
  project: Project | undefined;
  onSelect: (issueId: string) => void;
  isOverlay?: boolean;
}

export function KanbanCard({
  issue,
  member,
  project,
  onSelect,
  isOverlay = false,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: {
      type: "issue",
      issue,
    },
    disabled: isOverlay,
  });

  const style = isOverlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  const clientNowMs = useWorkspaceStore((s) => s.clientNowMs);
  const completedSubtasks = issue.subtasks.filter((s) => s.completed).length;
  const due = formatDueDate(issue.dueDate, issue.status === "done", clientNowMs);

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={style}
      {...(isOverlay ? {} : attributes)}
      {...(isOverlay ? {} : listeners)}
      onClick={() => {
        if (!isOverlay) onSelect(issue.id);
      }}
      role="button"
      tabIndex={isOverlay ? -1 : 0}
      onKeyDown={(e) => {
        if (!isOverlay && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onSelect(issue.id);
        }
      }}
      className={cn(
        "group relative cursor-grab rounded-xl border bg-[var(--bg-surface)] p-3 text-left transition-all active:cursor-grabbing",
        isDragging && !isOverlay
          ? "opacity-35 border-indigo-500/40 ring-1 ring-indigo-500/20"
          : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]/45",
        isOverlay &&
          "rotate-[1.2deg] scale-[1.02] cursor-grabbing border-indigo-500/60 shadow-2xl shadow-black/40 ring-2 ring-indigo-500/25"
      )}
    >
      {/* Top Row: Identifier, Project Color Dot, Priority */}
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {project && (
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: project.color }}
              title={project.name}
            />
          )}
          <span className="font-mono text-[11px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]">
            {issue.identifier}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            title={`Estimate: ${issue.estimate} pts`}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-1.5 py-0.2 font-mono text-[10px] text-[var(--text-muted)]"
          >
            {issue.estimate}pt
          </span>
          <PriorityIcon priority={issue.priority} className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Issue Title */}
      <h3 className="line-clamp-2 text-[13px] font-medium leading-[1.38] text-[var(--text-primary)]">
        {issue.title}
      </h3>

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {issue.labels.map((labelId) => {
            const label = LABEL_MAP[labelId];
            if (!label) return null;
            return (
              <span
                key={labelId}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10.5px] font-medium leading-none",
                  label.bgClass,
                  label.textClass
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", label.dotClass)} />
                {label.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer Meta Row */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
          {issue.subtasks.length > 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-mono text-[10.5px]",
                completedSubtasks === issue.subtasks.length &&
                  "text-emerald-600 dark:text-emerald-400"
              )}
              title={`${completedSubtasks} of ${issue.subtasks.length} subtasks completed`}
            >
              <CheckSquare className="h-3 w-3" />
              {completedSubtasks}/{issue.subtasks.length}
            </span>
          )}

          {issue.comments.length > 0 && (
            <span className="inline-flex items-center gap-1 font-mono text-[10.5px]">
              <MessageSquare className="h-3 w-3" />
              {issue.comments.length}
            </span>
          )}

          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-1 py-0.5 text-[10.5px] font-medium",
                due.tone === "overdue" &&
                  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                due.tone === "soon" &&
                  "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                due.tone === "normal" && "text-[var(--text-muted)]"
              )}
            >
              <Calendar className="h-2.5 w-2.5" />
              {due.label}
            </span>
          )}
        </div>

        <MemberAvatar member={member} size="xs" />
      </div>
    </div>
  );
}
