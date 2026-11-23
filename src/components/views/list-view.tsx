"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  Calendar,
  Check,
  CheckSquare,
  Layers,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { Issue, IssuePriority, IssueStatus } from "@/types/workspace";
import {
  LABEL_MAP,
  PRIORITY_LIST,
  PRIORITY_MAP,
  STATUS_LIST,
  STATUS_MAP,
} from "@/lib/constants";
import { useWorkspaceStore } from "@/store/workspace-store";
import {
  MemberAvatar,
  PriorityIcon,
  StatusIcon,
} from "@/components/icons/issue-icons";
import { cn, formatDueDate } from "@/lib/utils";

type GroupBy = "status" | "priority" | "none";
type SortBy = "updated" | "priority" | "dueDate" | "estimate";

export function ListView({ issues }: { issues: Issue[] }) {
  const members = useWorkspaceStore((s) => s.members);
  const projects = useWorkspaceStore((s) => s.projects);
  const selectedBulkIds = useWorkspaceStore((s) => s.selectedBulkIds);
  const clientNowMs = useWorkspaceStore((s) => s.clientNowMs);

  const setSelectedIssueId = useWorkspaceStore((s) => s.setSelectedIssueId);
  const updateIssue = useWorkspaceStore((s) => s.updateIssue);
  const openCreateModal = useWorkspaceStore((s) => s.openCreateModal);
  const toggleBulkSelect = useWorkspaceStore((s) => s.toggleBulkSelect);
  const selectAllBulk = useWorkspaceStore((s) => s.selectAllBulk);
  const clearBulkSelect = useWorkspaceStore((s) => s.clearBulkSelect);
  const bulkUpdateStatus = useWorkspaceStore((s) => s.bulkUpdateStatus);
  const bulkUpdatePriority = useWorkspaceStore((s) => s.bulkUpdatePriority);
  const bulkDeleteIssues = useWorkspaceStore((s) => s.bulkDeleteIssues);

  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [sortBy, setSortBy] = useState<SortBy>("priority");

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const sortedIssues = useMemo(() => {
    const copy = [...issues];
    copy.sort((a, b) => {
      switch (sortBy) {
        case "priority":
          return PRIORITY_MAP[b.priority].rank - PRIORITY_MAP[a.priority].rank;
        case "estimate":
          return b.estimate - a.estimate;
        case "dueDate": {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }
        case "updated":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return copy;
  }, [issues, sortBy]);

  const sections = useMemo(() => {
    if (groupBy === "none") {
      return [
        {
          key: "all",
          title: "All Issues",
          status: undefined as IssueStatus | undefined,
          priority: undefined as IssuePriority | undefined,
          items: sortedIssues,
        },
      ];
    }
    if (groupBy === "status") {
      return STATUS_LIST.map((st) => ({
        key: st.id,
        title: st.label,
        status: st.id,
        priority: undefined as IssuePriority | undefined,
        items: sortedIssues.filter((i) => i.status === st.id),
      })).filter((sec) => sec.items.length > 0);
    }
    return PRIORITY_LIST.map((pr) => ({
      key: pr.id,
      title: pr.label,
      status: undefined as IssueStatus | undefined,
      priority: pr.id,
      items: sortedIssues.filter((i) => i.priority === pr.id),
    })).filter((sec) => sec.items.length > 0);
  }, [groupBy, sortedIssues]);

  const allSelected =
    sortedIssues.length > 0 && selectedBulkIds.length === sortedIssues.length;

  const cycleStatus = (issue: Issue, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STATUS_LIST.findIndex((s) => s.id === issue.status);
    const next = STATUS_LIST[(idx + 1) % STATUS_LIST.length].id;
    updateIssue(issue.id, { status: next });
    toast.success(`${issue.identifier} → ${STATUS_MAP[next].label}`);
  };

  const cyclePriority = (issue: Issue, e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = PRIORITY_LIST.findIndex((p) => p.id === issue.priority);
    const next = PRIORITY_LIST[(idx + 1) % PRIORITY_LIST.length].id;
    updateIssue(issue.id, { priority: next });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Sub-toolbar: Group by & Sort */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/40 px-4 py-2 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              allSelected
                ? clearBulkSelect()
                : selectAllBulk(sortedIssues.map((i) => i.id))
            }
            className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded border transition-colors",
                allSelected
                  ? "border-indigo-500 bg-indigo-600 text-white"
                  : "border-[var(--border-strong)] bg-[var(--bg-surface)]"
              )}
            >
              {allSelected && <Check className="h-3 w-3" />}
            </span>
            <span>Select all ({sortedIssues.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Group By */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11.5px]">
            <Layers className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Group:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupBy)}
              aria-label="Group issues by"
              className="bg-transparent font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option value="status" className="bg-[var(--bg-surface)]">
                Status
              </option>
              <option value="priority" className="bg-[var(--bg-surface)]">
                Priority
              </option>
              <option value="none" className="bg-[var(--bg-surface)]">
                None
              </option>
            </select>
          </div>

          {/* Sort By */}
          <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11.5px]">
            <ArrowUpDown className="h-3 w-3 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              aria-label="Sort issues by"
              className="bg-transparent font-medium text-[var(--text-primary)] focus:outline-none"
            >
              <option value="priority" className="bg-[var(--bg-surface)]">
                Priority
              </option>
              <option value="updated" className="bg-[var(--bg-surface)]">
                Recently Updated
              </option>
              <option value="dueDate" className="bg-[var(--bg-surface)]">
                Due Date
              </option>
              <option value="estimate" className="bg-[var(--bg-surface)]">
                Estimate
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 md:px-6">
        {sortedIssues.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] text-center">
            <p className="text-[14px] font-medium text-[var(--text-primary)]">
              No matching issues
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--text-muted)]">
              Try adjusting your filters or create a new issue.
            </p>
            <button
              type="button"
              onClick={() => openCreateModal("todo")}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              New Issue
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {sections.map((section) => (
              <div
                key={section.key}
                className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/65 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    {section.status && (
                      <StatusIcon status={section.status} className="h-3.5 w-3.5" />
                    )}
                    {section.priority && (
                      <PriorityIcon
                        priority={section.priority}
                        className="h-3.5 w-3.5"
                      />
                    )}
                    <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
                      {section.title}
                    </span>
                    <span className="rounded bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--text-muted)]">
                      {section.items.length}
                    </span>
                  </div>

                  {section.status && (
                    <button
                      type="button"
                      onClick={() => openCreateModal(section.status)}
                      className="flex h-6 w-6 items-center justify-center rounded text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      title={`Add issue to ${section.title}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Issue Rows */}
                <div className="divide-y divide-[var(--border-subtle)]">
                  {section.items.map((issue) => {
                    const selected = selectedBulkIds.includes(issue.id);
                    const member = issue.assigneeId
                      ? memberMap.get(issue.assigneeId)
                      : undefined;
                    const project = projectMap.get(issue.projectId);
                    const due = formatDueDate(
                      issue.dueDate,
                      issue.status === "done",
                      clientNowMs
                    );
                    const doneSub = issue.subtasks.filter(
                      (s) => s.completed
                    ).length;

                    return (
                      <div
                        key={issue.id}
                        onClick={() => setSelectedIssueId(issue.id)}
                        className={cn(
                          "group flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-[13px] transition-colors",
                          selected
                            ? "bg-indigo-500/[0.08]"
                            : "hover:bg-[var(--bg-elevated)]/65"
                        )}
                      >
                        {/* Bulk Checkbox */}
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={selected}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBulkSelect(issue.id);
                          }}
                          aria-label={`Select ${issue.identifier}`}
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            selected
                              ? "border-indigo-500 bg-indigo-600 text-white"
                              : "border-[var(--border-strong)] bg-transparent opacity-45 group-hover:opacity-100"
                          )}
                        >
                          {selected && <Check className="h-3 w-3" />}
                        </button>

                        {/* Priority Quick Cycle */}
                        <button
                          type="button"
                          onClick={(e) => cyclePriority(issue, e)}
                          title={`Priority: ${PRIORITY_MAP[issue.priority].label} (click to cycle)`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-[var(--bg-elevated)]"
                        >
                          <PriorityIcon priority={issue.priority} />
                        </button>

                        {/* Identifier */}
                        <span className="w-[68px] shrink-0 font-mono text-[11.5px] font-medium text-[var(--text-muted)]">
                          {issue.identifier}
                        </span>

                        {/* Status Quick Cycle */}
                        <button
                          type="button"
                          onClick={(e) => cycleStatus(issue, e)}
                          title={`Status: ${STATUS_MAP[issue.status].label} (click to advance)`}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-[var(--bg-elevated)]"
                        >
                          <StatusIcon status={issue.status} />
                        </button>

                        {/* Title + Project dot */}
                        <div className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-[var(--text-primary)]">
                            {issue.title}
                          </span>
                        </div>

                        {/* Labels (hidden on small screens) */}
                        <div className="hidden items-center gap-1 md:flex">
                          {issue.labels.slice(0, 2).map((labelId) => {
                            const label = LABEL_MAP[labelId];
                            if (!label) return null;
                            return (
                              <span
                                key={labelId}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10.5px] font-medium",
                                  label.bgClass,
                                  label.textClass
                                )}
                              >
                                <span
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    label.dotClass
                                  )}
                                />
                                {label.name}
                              </span>
                            );
                          })}
                        </div>

                        {/* Subtasks & Comments */}
                        <div className="hidden w-[66px] items-center justify-end gap-2 font-mono text-[11px] text-[var(--text-muted)] lg:flex">
                          {issue.subtasks.length > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <CheckSquare className="h-3 w-3" />
                              {doneSub}/{issue.subtasks.length}
                            </span>
                          )}
                          {issue.comments.length > 0 && (
                            <span className="inline-flex items-center gap-0.5">
                              <MessageSquare className="h-3 w-3" />
                              {issue.comments.length}
                            </span>
                          )}
                        </div>

                        {/* Project badge */}
                        {project && (
                          <span className="hidden items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] xl:inline-flex">
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            {project.key}
                          </span>
                        )}

                        {/* Estimate */}
                        <span className="hidden w-9 text-right font-mono text-[11px] text-[var(--text-muted)] sm:inline-block">
                          {issue.estimate}pt
                        </span>

                        {/* Due Date */}
                        <div className="hidden w-[88px] justify-end sm:flex">
                          {due ? (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium",
                                due.tone === "overdue" &&
                                  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                                due.tone === "soon" &&
                                  "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                                due.tone === "normal" &&
                                  "text-[var(--text-muted)]"
                              )}
                            >
                              <Calendar className="h-2.5 w-2.5" />
                              {due.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-[var(--text-muted)]">
                              —
                            </span>
                          )}
                        </div>

                        {/* Assignee */}
                        <MemberAvatar member={member} size="xs" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedBulkIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)]/95 px-3.5 py-2 shadow-2xl backdrop-blur-md"
          >
            <span className="inline-flex items-center gap-1.5 pr-1 text-[12.5px] font-medium text-[var(--text-primary)]">
              <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-indigo-600 px-1.5 font-mono text-[11px] text-white">
                {selectedBulkIds.length}
              </span>
              selected
            </span>

            <div className="h-4 w-px bg-[var(--border-strong)]" />

            {/* Bulk Move Status */}
            <select
              defaultValue=""
              aria-label="Bulk update status"
              onChange={(e) => {
                if (!e.target.value) return;
                const next = e.target.value as IssueStatus;
                bulkUpdateStatus(next);
                toast.success(
                  `Updated status to ${STATUS_MAP[next].label}`
                );
                e.target.value = "";
              }}
              className="h-7 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 text-[12px] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="" disabled>
                Set status…
              </option>
              {STATUS_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Bulk Priority */}
            <select
              defaultValue=""
              aria-label="Bulk update priority"
              onChange={(e) => {
                if (!e.target.value) return;
                const next = e.target.value as IssuePriority;
                bulkUpdatePriority(next);
                toast.success(
                  `Updated priority to ${PRIORITY_MAP[next].label}`
                );
                e.target.value = "";
              }}
              className="h-7 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 text-[12px] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="" disabled>
                Set priority…
              </option>
              {PRIORITY_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                const count = selectedBulkIds.length;
                bulkDeleteIssues();
                toast.success(`Deleted ${count} issue${count > 1 ? "s" : ""}`);
              }}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 text-[12px] font-medium text-rose-600 transition-colors hover:bg-rose-500/20 dark:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>

            <button
              type="button"
              onClick={clearBulkSelect}
              aria-label="Clear selection"
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
