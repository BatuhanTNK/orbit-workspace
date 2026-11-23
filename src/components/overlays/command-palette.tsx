"use client";

import { Command } from "cmdk";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  AlertCircle,
  BarChart3,
  Columns3,
  Download,
  ExternalLink,
  FolderKanban,
  Keyboard,
  ListTodo,
  Moon,
  Plus,
  RotateCcw,
  Search,
  Sun,
  XCircle,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PriorityIcon, StatusIcon } from "@/components/icons/issue-icons";
import { exportIssuesToCSV, exportWorkspaceToJSON } from "@/lib/utils";

export function CommandPalette() {
  const { resolvedTheme, setTheme } = useTheme();

  const open = useWorkspaceStore((s) => s.commandPaletteOpen);
  const issues = useWorkspaceStore((s) => s.issues);
  const projects = useWorkspaceStore((s) => s.projects);
  const members = useWorkspaceStore((s) => s.members);

  const setCommandPaletteOpen = useWorkspaceStore(
    (s) => s.setCommandPaletteOpen
  );
  const setSelectedIssueId = useWorkspaceStore((s) => s.setSelectedIssueId);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setActiveProjectId = useWorkspaceStore((s) => s.setActiveProjectId);
  const openCreateModal = useWorkspaceStore((s) => s.openCreateModal);
  const togglePriorityFilter = useWorkspaceStore((s) => s.togglePriorityFilter);
  const clearFilters = useWorkspaceStore((s) => s.clearFilters);
  const setShortcutsModalOpen = useWorkspaceStore(
    (s) => s.setShortcutsModalOpen
  );
  const resetDemoData = useWorkspaceStore((s) => s.resetDemoData);
  const getSnapshot = useWorkspaceStore((s) => s.getSnapshot);

  if (!open) return null;

  const runAndClose = (fn: () => void) => {
    setCommandPaletteOpen(false);
    fn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4">
      {/* Backdrop */}
      <div
        onClick={() => setCommandPaletteOpen(false)}
        className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <Command
        role="dialog"
        aria-modal="true"
        aria-label="Orbit Command Menu"
        label="Orbit Command Menu"
        className="relative z-10 w-full max-w-[600px] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search issues (e.g. ORB-101, analytics, theme)…"
            className="h-12 w-full bg-transparent text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <span className="kbd">ESC</span>
        </div>

        <Command.List className="max-h-[380px] overflow-y-auto p-2">
          <Command.Empty className="py-10 text-center text-[13px] text-[var(--text-muted)]">
            No matching commands or issues.
          </Command.Empty>

          {/* Quick Actions */}
          <Command.Group
            heading="Actions"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
          >
            <Command.Item
              onSelect={() => runAndClose(() => openCreateModal("todo"))}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <Plus className="h-4 w-4 text-indigo-500" />
                Create new issue
              </span>
              <span className="kbd">C</span>
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => {
                  clearFilters();
                  togglePriorityFilter("urgent");
                  setViewMode("list");
                  toast.info("Filtered to urgent issues");
                })
              }
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                Filter urgent issues
              </span>
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => {
                  clearFilters();
                  toast.info("Cleared all filters");
                })
              }
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <XCircle className="h-4 w-4 text-[var(--text-muted)]" />
                Clear all active filters
              </span>
            </Command.Item>
          </Command.Group>

          {/* Navigation */}
          <Command.Group
            heading="Navigation & Views"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
          >
            <Command.Item
              onSelect={() => runAndClose(() => setViewMode("board"))}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <Columns3 className="h-4 w-4 text-[var(--text-muted)]" />
                Go to Kanban Board
              </span>
              <span className="kbd">1</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runAndClose(() => setViewMode("list"))}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <ListTodo className="h-4 w-4 text-[var(--text-muted)]" />
                Go to List &amp; Triage
              </span>
              <span className="kbd">2</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runAndClose(() => setViewMode("analytics"))}
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <BarChart3 className="h-4 w-4 text-[var(--text-muted)]" />
                Go to Sprint Analytics
              </span>
              <span className="kbd">3</span>
            </Command.Item>

            <Command.Item
              onSelect={() => runAndClose(() => setActiveProjectId("all"))}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <FolderKanban className="h-4 w-4 text-[var(--text-muted)]" />
              Switch to All Projects
            </Command.Item>

            {projects.map((p) => (
              <Command.Item
                key={p.id}
                value={`project ${p.name} ${p.key}`}
                onSelect={() => runAndClose(() => setActiveProjectId(p.id))}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span>Project: {p.name}</span>
              </Command.Item>
            ))}
          </Command.Group>

          {/* Issues Search */}
          <Command.Group
            heading="Issues"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
          >
            {issues.map((issue) => (
              <Command.Item
                key={issue.id}
                value={`${issue.identifier} ${issue.title} ${issue.labels.join(" ")}`}
                onSelect={() =>
                  runAndClose(() => setSelectedIssueId(issue.id))
                }
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <StatusIcon status={issue.status} className="h-3.5 w-3.5" />
                  <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)]">
                    {issue.identifier}
                  </span>
                  <span className="truncate">{issue.title}</span>
                </span>
                <PriorityIcon
                  priority={issue.priority}
                  className="h-3.5 w-3.5 shrink-0"
                />
              </Command.Item>
            ))}
          </Command.Group>

          {/* Workspace Utilities */}
          <Command.Group
            heading="Preferences & Data"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10.5px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[var(--text-muted)]"
          >
            <Command.Item
              onSelect={() =>
                runAndClose(() =>
                  setTheme(resolvedTheme === "light" ? "dark" : "light")
                )
              }
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              {resolvedTheme === "light" ? (
                <Moon className="h-4 w-4 text-[var(--text-muted)]" />
              ) : (
                <Sun className="h-4 w-4 text-[var(--text-muted)]" />
              )}
              Toggle Dark / Light Theme
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => {
                  window.open(window.location.href, "_blank", "noopener");
                })
              }
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <ExternalLink className="h-4 w-4 text-emerald-500" />
              Open Mirror Tab (Test Live Sync)
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => {
                  exportIssuesToCSV(issues, projects, members);
                  toast.success("Exported issues as CSV");
                })
              }
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <Download className="h-4 w-4 text-[var(--text-muted)]" />
              Export Issues as CSV
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => {
                  exportWorkspaceToJSON(getSnapshot());
                  toast.success("Exported workspace snapshot as JSON");
                })
              }
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <Download className="h-4 w-4 text-[var(--text-muted)]" />
              Export Snapshot as JSON
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => setShortcutsModalOpen(true))
              }
              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] text-[var(--text-primary)] aria-selected:bg-indigo-500/15"
            >
              <span className="flex items-center gap-2.5">
                <Keyboard className="h-4 w-4 text-[var(--text-muted)]" />
                View Keyboard Shortcuts
              </span>
              <span className="kbd">?</span>
            </Command.Item>

            <Command.Item
              onSelect={() =>
                runAndClose(() => {
                  resetDemoData();
                  toast.success("Demo workspace reset");
                })
              }
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-rose-500 aria-selected:bg-rose-500/10"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Demo Data
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
