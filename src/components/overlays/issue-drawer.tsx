"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Check,
  CheckSquare,
  Link2,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { IssuePriority, IssueStatus, LabelId } from "@/types/workspace";
import {
  ESTIMATE_OPTIONS,
  LABEL_LIST,
  PRIORITY_LIST,
  STATUS_LIST,
} from "@/lib/constants";
import { useWorkspaceStore } from "@/store/workspace-store";
import {
  MemberAvatar,
  PriorityIcon,
  StatusIcon,
} from "@/components/icons/issue-icons";
import { cn, formatRelativeTime } from "@/lib/utils";

export function IssueDrawer() {
  const selectedIssueId = useWorkspaceStore((s) => s.selectedIssueId);
  const issues = useWorkspaceStore((s) => s.issues);
  const members = useWorkspaceStore((s) => s.members);
  const projects = useWorkspaceStore((s) => s.projects);
  const clientNowMs = useWorkspaceStore((s) => s.clientNowMs);

  const setSelectedIssueId = useWorkspaceStore((s) => s.setSelectedIssueId);
  const updateIssue = useWorkspaceStore((s) => s.updateIssue);
  const deleteIssue = useWorkspaceStore((s) => s.deleteIssue);
  const restoreIssue = useWorkspaceStore((s) => s.restoreIssue);
  const addSubtask = useWorkspaceStore((s) => s.addSubtask);
  const toggleSubtask = useWorkspaceStore((s) => s.toggleSubtask);
  const deleteSubtask = useWorkspaceStore((s) => s.deleteSubtask);
  const addComment = useWorkspaceStore((s) => s.addComment);

  const issue = selectedIssueId
    ? issues.find((i) => i.id === selectedIssueId) ?? null
    : null;

  const [titleDraft, setTitleDraft] = useState<string | null>(null);
  const [descDraft, setDescDraft] = useState<string | null>(null);
  const [newSubtask, setNewSubtask] = useState("");
  const [newComment, setNewComment] = useState("");

  const handleTitleBlur = () => {
    if (!issue || titleDraft === null) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== issue.title) {
      updateIssue(issue.id, { title: trimmed });
    }
    setTitleDraft(null);
  };

  const handleDescBlur = () => {
    if (!issue || descDraft === null) return;
    if (descDraft !== issue.description) {
      updateIssue(issue.id, { description: descDraft });
    }
    setDescDraft(null);
  };

  const handleCopyLink = async () => {
    if (!issue) return;
    const url = new URL(window.location.href);
    url.searchParams.set("issue", issue.identifier);
    try {
      await navigator.clipboard.writeText(url.toString());
      toast.success(`Copied link to ${issue.identifier}`);
    } catch {
      toast.info(`Share link: ?issue=${issue.identifier}`);
    }
  };

  const handleDelete = () => {
    if (!issue) return;
    const deleted = deleteIssue(issue.id);
    if (deleted) {
      toast.success(`Deleted ${deleted.identifier}`, {
        description: deleted.title,
        action: {
          label: "Undo",
          onClick: () => {
            restoreIssue(deleted);
            toast.success(`Restored ${deleted.identifier}`);
          },
        },
      });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !newSubtask.trim()) return;
    addSubtask(issue.id, newSubtask);
    setNewSubtask("");
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !newComment.trim()) return;
    addComment(issue.id, newComment);
    setNewComment("");
  };

  const toggleLabel = (labelId: LabelId) => {
    if (!issue) return;
    const exists = issue.labels.includes(labelId);
    const next = exists
      ? issue.labels.filter((l) => l !== labelId)
      : [...issue.labels, labelId];
    updateIssue(issue.id, { labels: next });
  };

  const project = issue
    ? projects.find((p) => p.id === issue.projectId)
    : undefined;

  const doneSubtasks = issue
    ? issue.subtasks.filter((s) => s.completed).length
    : 0;
  const subtaskPct =
    issue && issue.subtasks.length > 0
      ? Math.round((doneSubtasks / issue.subtasks.length) * 100)
      : 0;

  return (
    <AnimatePresence>
      {issue && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setSelectedIssueId(null)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
          />

          {/* Slide-over Panel */}
          <motion.aside
            key="drawer-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 38 }}
            aria-label={`Issue details for ${issue.identifier}`}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[580px] flex-col border-l border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
          >
            {/* Top Bar */}
            <div className="flex h-13 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-5">
              <div className="flex items-center gap-2">
                {project && (
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </span>
                )}
                <span className="font-mono text-[12.5px] font-semibold text-[var(--text-primary)]">
                  {issue.identifier}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Copy shareable issue link"
                  className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copy link</span>
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  title="Delete issue"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIssueId(null)}
                  title="Close (Esc)"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              {/* Editable Title & Description */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={titleDraft ?? issue.title}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleBlur}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  aria-label="Issue title"
                  className="w-full bg-transparent text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] focus:outline-none"
                />

                <textarea
                  value={descDraft ?? issue.description}
                  onChange={(e) => setDescDraft(e.target.value)}
                  onBlur={handleDescBlur}
                  rows={4}
                  placeholder="Add description, acceptance criteria, or technical notes…"
                  aria-label="Issue description"
                  className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-[13px] leading-relaxed text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500/50 focus:text-[var(--text-primary)] focus:outline-none"
                />
              </div>

              {/* Properties Grid */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">
                      Status
                    </span>
                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1">
                      <StatusIcon status={issue.status} className="h-3.5 w-3.5" />
                      <select
                        value={issue.status}
                        onChange={(e) =>
                          updateIssue(issue.id, {
                            status: e.target.value as IssueStatus,
                          })
                        }
                        aria-label="Issue status"
                        className="bg-transparent text-[12px] font-medium text-[var(--text-primary)] focus:outline-none"
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
                  </div>

                  {/* Priority */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">
                      Priority
                    </span>
                    <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1">
                      <PriorityIcon
                        priority={issue.priority}
                        className="h-3.5 w-3.5"
                      />
                      <select
                        value={issue.priority}
                        onChange={(e) =>
                          updateIssue(issue.id, {
                            priority: e.target.value as IssuePriority,
                          })
                        }
                        aria-label="Issue priority"
                        className="bg-transparent text-[12px] font-medium text-[var(--text-primary)] focus:outline-none"
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
                  </div>

                  {/* Assignee */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">
                      Assignee
                    </span>
                    <select
                      value={issue.assigneeId ?? ""}
                      onChange={(e) =>
                        updateIssue(issue.id, {
                          assigneeId: e.target.value || null,
                        })
                      }
                      aria-label="Issue assignee"
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-primary)] focus:outline-none"
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
                  </div>

                  {/* Estimate */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] text-[var(--text-muted)]">
                      Estimate
                    </span>
                    <div className="flex items-center gap-1">
                      {ESTIMATE_OPTIONS.map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => updateIssue(issue.id, { estimate: pt })}
                          className={cn(
                            "h-6 w-6 rounded-md font-mono text-[11px] font-medium transition-colors",
                            issue.estimate === pt
                              ? "bg-indigo-600 text-white"
                              : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                          )}
                        >
                          {pt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center justify-between gap-2 sm:col-span-2">
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
                      <Calendar className="h-3.5 w-3.5" />
                      Target Date
                    </span>
                    <input
                      type="date"
                      value={issue.dueDate ?? ""}
                      onChange={(e) =>
                        updateIssue(issue.id, {
                          dueDate: e.target.value || null,
                        })
                      }
                      aria-label="Target due date"
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-[11.5px] text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Labels Selector */}
                <div className="mt-3.5 border-t border-[var(--border-subtle)] pt-3">
                  <div className="mb-2 text-[11.5px] text-[var(--text-muted)]">
                    Labels
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {LABEL_LIST.map((label) => {
                      const active = issue.labels.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          type="button"
                          onClick={() => toggleLabel(label.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all",
                            active
                              ? `${label.bgClass} ${label.textClass} ring-1 ring-current/30`
                              : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              label.dotClass
                            )}
                          />
                          {label.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Subtasks Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-primary)]">
                    <CheckSquare className="h-4 w-4 text-indigo-500" />
                    <span>Subtasks</span>
                    {issue.subtasks.length > 0 && (
                      <span className="font-mono text-[11px] font-normal text-[var(--text-muted)]">
                        {doneSubtasks}/{issue.subtasks.length} · {subtaskPct}%
                      </span>
                    )}
                  </div>
                </div>

                {issue.subtasks.length > 0 && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${subtaskPct}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {issue.subtasks.map((st) => (
                    <div
                      key={st.id}
                      className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--bg-elevated)]/65"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(issue.id, st.id)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            st.completed
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-[var(--border-strong)] bg-[var(--bg-canvas)]"
                          )}
                        >
                          {st.completed && <Check className="h-3 w-3" />}
                        </span>
                        <span
                          className={cn(
                            "truncate text-[13px]",
                            st.completed
                              ? "text-[var(--text-muted)] line-through"
                              : "text-[var(--text-primary)]"
                          )}
                        >
                          {st.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSubtask(issue.id, st.id)}
                        aria-label="Remove subtask"
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-[var(--text-muted)] hover:text-rose-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      placeholder="Add a subtask…"
                      className="h-8 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] pl-8 pr-3 text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500/50 focus:outline-none"
                    />
                  </div>
                  {newSubtask.trim() && (
                    <button
                      type="submit"
                      className="h-8 rounded-lg bg-indigo-600 px-3 text-[12px] font-medium text-white hover:bg-indigo-500"
                    >
                      Add
                    </button>
                  )}
                </form>
              </div>

              {/* Comments Section */}
              <div className="space-y-3 border-t border-[var(--border-subtle)] pt-5">
                <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-primary)]">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>Comments</span>
                  <span className="font-mono text-[11px] font-normal text-[var(--text-muted)]">
                    {issue.comments.length}
                  </span>
                </div>

                {issue.comments.length > 0 && (
                  <div className="space-y-3">
                    {issue.comments.map((comment) => {
                      const author = members.find(
                        (m) => m.id === comment.authorId
                      );
                      return (
                        <div
                          key={comment.id}
                          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3"
                        >
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MemberAvatar member={author} size="xs" />
                              <span className="text-[12px] font-medium text-[var(--text-primary)]">
                                {author?.name ?? "Teammate"}
                              </span>
                            </div>
                            <span className="font-mono text-[10.5px] text-[var(--text-muted)]">
                              {formatRelativeTime(comment.createdAt, clientNowMs)}
                            </span>
                          </div>
                          <p className="text-[12.5px] leading-relaxed text-[var(--text-secondary)]">
                            {comment.body}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <form onSubmit={handlePostComment} className="space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        if (newComment.trim()) {
                          addComment(issue.id, newComment);
                          setNewComment("");
                        }
                      }
                    }}
                    rows={2}
                    placeholder="Leave a comment… (⌘↵ to post)"
                    className="w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500/50 focus:outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Updated {formatRelativeTime(issue.updatedAt, clientNowMs)}
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[12px] font-medium text-white transition-all hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Send className="h-3 w-3" />
                      Comment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
