"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, X } from "lucide-react";
import { toast } from "sonner";
import type {
  IssuePriority,
  IssueStatus,
  LabelId,
  Member,
  Project,
} from "@/types/workspace";
import {
  ESTIMATE_OPTIONS,
  LABEL_LIST,
  PRIORITY_LIST,
  STATUS_LIST,
} from "@/lib/constants";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PriorityIcon, StatusIcon } from "@/components/icons/issue-icons";
import { cn } from "@/lib/utils";

interface CreateIssueFormProps {
  defaultStatus: IssueStatus;
  initialProjectId: string;
  projects: Project[];
  members: Member[];
  onClose: () => void;
}

function CreateIssueForm({
  defaultStatus,
  initialProjectId,
  projects,
  members,
  onClose,
}: CreateIssueFormProps) {
  const createIssue = useWorkspaceStore((s) => s.createIssue);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState(initialProjectId);
  const [status, setStatus] = useState<IssueStatus>(defaultStatus);
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>(members[0]?.id ?? "");
  const [estimate, setEstimate] = useState<number>(3);
  const [dueDate, setDueDate] = useState<string>("");
  const [labels, setLabels] = useState<LabelId[]>(["feature"]);
  const [createMore, setCreateMore] = useState(false);

  const toggleLabel = (id: LabelId) => {
    setLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an issue title");
      return;
    }

    const created = createIssue({
      title,
      description,
      projectId,
      status,
      priority,
      assigneeId: assigneeId || null,
      labels,
      estimate,
      dueDate: dueDate || null,
    });

    toast.success(`Created ${created.identifier}`, {
      description: created.title,
    });

    setTitle("");
    setDescription("");
    setDueDate("");

    if (!createMore) {
      onClose();
    }
  };

  const selectedProject = projects.find((p) => p.id === projectId);

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
      }}
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            aria-label="Project"
            className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 text-[12px] font-medium text-[var(--text-primary)] focus:outline-none"
          >
            {projects.map((p) => (
              <option
                key={p.id}
                value={p.id}
                className="bg-[var(--bg-surface)]"
              >
                {p.key} · {p.name}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-[var(--text-muted)]">›</span>
          <span className="text-[12.5px] font-medium text-[var(--text-secondary)]">
            New Issue
          </span>
          {selectedProject && (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Title & Description */}
      <div className="space-y-2 px-5 pb-3 pt-4">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Issue title"
          className="w-full bg-transparent text-[16.5px] font-semibold tracking-[-0.015em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add description, implementation plan, or acceptance criteria…"
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none"
        />
      </div>

      {/* Compact Metadata Pills */}
      <div className="flex flex-wrap items-center gap-2 px-5 pb-3">
        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1">
          <StatusIcon status={status} className="h-3.5 w-3.5" />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IssueStatus)}
            aria-label="Status"
            className="bg-transparent text-[12px] text-[var(--text-primary)] focus:outline-none"
          >
            {STATUS_LIST.map((s) => (
              <option
                key={s.id}
                value={s.id}
                className="bg-[var(--bg-surface)]"
              >
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1">
          <PriorityIcon priority={priority} className="h-3.5 w-3.5" />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as IssuePriority)}
            aria-label="Priority"
            className="bg-transparent text-[12px] text-[var(--text-primary)] focus:outline-none"
          >
            {PRIORITY_LIST.map((p) => (
              <option
                key={p.id}
                value={p.id}
                className="bg-[var(--bg-surface)]"
              >
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          aria-label="Assignee"
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[12px] text-[var(--text-primary)] focus:outline-none"
        >
          <option value="" className="bg-[var(--bg-surface)]">
            Unassigned
          </option>
          {members.map((m) => (
            <option
              key={m.id}
              value={m.id}
              className="bg-[var(--bg-surface)]"
            >
              {m.name}
            </option>
          ))}
        </select>

        <select
          value={estimate}
          onChange={(e) => setEstimate(Number(e.target.value))}
          aria-label="Estimate points"
          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1 font-mono text-[11.5px] text-[var(--text-primary)] focus:outline-none"
        >
          {ESTIMATE_OPTIONS.map((pt) => (
            <option
              key={pt}
              value={pt}
              className="bg-[var(--bg-surface)]"
            >
              {pt} pts
            </option>
          ))}
        </select>

        <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-1">
          <Calendar className="h-3 w-3 text-[var(--text-muted)]" />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            aria-label="Due date"
            className="bg-transparent font-mono text-[11.5px] text-[var(--text-primary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Labels Row */}
      <div className="flex flex-wrap items-center gap-1.5 px-5 pb-4">
        {LABEL_LIST.map((label) => {
          const selected = labels.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              onClick={() => toggleLabel(label.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all",
                selected
                  ? `${label.bgClass} ${label.textClass}`
                  : "border-[var(--border-subtle)] bg-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", label.dotClass)}
              />
              {label.name}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/60 px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={createMore}
            onChange={(e) => setCreateMore(e.target.checked)}
            className="h-3.5 w-3.5 rounded accent-indigo-600"
          />
          Create more
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-[12.5px] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-500"
          >
            <span>Create Issue</span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px]">
              ⌘↵
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

export function CreateIssueModal() {
  const open = useWorkspaceStore((s) => s.createModalOpen);
  const defaultStatus = useWorkspaceStore((s) => s.createModalDefaultStatus);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const projects = useWorkspaceStore((s) => s.projects);
  const members = useWorkspaceStore((s) => s.members);
  const closeCreateModal = useWorkspaceStore((s) => s.closeCreateModal);

  const initialProjectId =
    activeProjectId === "all"
      ? projects[0]?.id ?? "proj-core"
      : activeProjectId;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            onClick={closeCreateModal}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label="Create new issue"
            className="relative z-10 w-full max-w-[600px] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
          >
            <CreateIssueForm
              key={`${defaultStatus}-${initialProjectId}`}
              defaultStatus={defaultStatus}
              initialProjectId={initialProjectId}
              projects={projects}
              members={members}
              onClose={closeCreateModal}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
