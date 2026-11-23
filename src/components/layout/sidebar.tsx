"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  BarChart3,
  Columns3,
  Download,
  ExternalLink,
  FolderKanban,
  Keyboard,
  Layers,
  ListTodo,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  Sparkles,
  Sun,
} from "lucide-react";
import { OrbitLogo } from "@/components/icons/orbit-logo";
import { MemberAvatar } from "@/components/icons/issue-icons";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn, exportIssuesToCSV, exportWorkspaceToJSON } from "@/lib/utils";
import type { Project, ViewMode } from "@/types/workspace";

const PROJECT_ICON_MAP: Record<Project["icon"], typeof Layers> = {
  layers: Layers,
  sparkles: Sparkles,
  smartphone: Smartphone,
};

const emptySubscribe = () => () => {};

export function Sidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const projects = useWorkspaceStore((s) => s.projects);
  const members = useWorkspaceStore((s) => s.members);
  const issues = useWorkspaceStore((s) => s.issues);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const sidebarCollapsed = useWorkspaceStore((s) => s.sidebarCollapsed);
  const connectedTabs = useWorkspaceStore((s) => s.connectedTabs);

  const setActiveProjectId = useWorkspaceStore((s) => s.setActiveProjectId);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setSidebarCollapsed = useWorkspaceStore((s) => s.setSidebarCollapsed);
  const openCreateModal = useWorkspaceStore((s) => s.openCreateModal);
  const setCommandPaletteOpen = useWorkspaceStore(
    (s) => s.setCommandPaletteOpen
  );
  const setShortcutsModalOpen = useWorkspaceStore(
    (s) => s.setShortcutsModalOpen
  );
  const resetDemoData = useWorkspaceStore((s) => s.resetDemoData);
  const getSnapshot = useWorkspaceStore((s) => s.getSnapshot);

  const navItems: {
    id: ViewMode;
    label: string;
    shortcut: string;
    icon: typeof Columns3;
  }[] = [
    { id: "board", label: "Kanban Board", shortcut: "1", icon: Columns3 },
    { id: "list", label: "List & Triage", shortcut: "2", icon: ListTodo },
    { id: "analytics", label: "Sprint Analytics", shortcut: "3", icon: BarChart3 },
  ];

  const handleExportCsv = () => {
    exportIssuesToCSV(issues, projects, members);
    toast.success("Exported issues to CSV", {
      description: `${issues.length} issues downloaded.`,
    });
  };

  const handleExportJson = () => {
    exportWorkspaceToJSON(getSnapshot());
    toast.success("Exported workspace JSON snapshot");
  };

  const handleResetDemo = () => {
    resetDemoData();
    toast.success("Demo workspace restored", {
      description: "Sample projects, issues, and cycle metrics reset.",
    });
  };

  const handleOpenMirrorTab = () => {
    window.open(window.location.href, "_blank", "noopener");
  };

  const isDark = mounted ? resolvedTheme !== "light" : true;
  const activeUser = members[0];

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-sidebar)] transition-[width] duration-200 ease-out select-none",
        sidebarCollapsed ? "w-[62px]" : "w-[248px]"
      )}
    >
      {/* Top workspace brand row */}
      <div className="flex h-13 items-center justify-between px-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <OrbitLogo />
          {!sidebarCollapsed && (
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[13.5px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                  Orbit
                </span>
                <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-indigo-600 dark:text-indigo-300">
                  PRO
                </span>
              </div>
              <p className="truncate text-[11px] text-[var(--text-muted)]">
                Acme Engineering
              </p>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? "Expand sidebar ([)" : "Collapse sidebar ([)"}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Quick Actions: Search & Create */}
      <div className={cn("px-2.5 pb-2 space-y-1.5", sidebarCollapsed && "px-2")}>
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          title="Command Palette (⌘K)"
          className={cn(
            "flex w-full items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[12.5px] text-[var(--text-secondary)] transition-all hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
            sidebarCollapsed
              ? "h-8 justify-center px-0"
              : "h-8 justify-between px-2.5"
          )}
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            {!sidebarCollapsed && <span>Quick search…</span>}
          </span>
          {!sidebarCollapsed && <span className="kbd">⌘K</span>}
        </button>

        <button
          type="button"
          onClick={() => openCreateModal("todo")}
          title="New Issue (C)"
          className={cn(
            "flex w-full items-center rounded-lg bg-indigo-600 text-[12.5px] font-medium text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.99]",
            sidebarCollapsed
              ? "h-8 justify-center px-0"
              : "h-8 justify-between px-2.5"
          )}
        >
          <span className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            {!sidebarCollapsed && <span>New Issue</span>}
          </span>
          {!sidebarCollapsed && (
            <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] font-medium text-indigo-100">
              C
            </span>
          )}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-5">
        {/* Views Section */}
        <div>
          {!sidebarCollapsed && (
            <div className="mb-1.5 px-2 text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Workspace
            </div>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = viewMode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setViewMode(item.id)}
                  title={sidebarCollapsed ? `${item.label} (${item.shortcut})` : undefined}
                  className={cn(
                    "group flex w-full items-center rounded-md text-[13px] transition-colors",
                    sidebarCollapsed
                      ? "h-8 justify-center px-0"
                      : "h-8 justify-between px-2",
                    active
                      ? "bg-[var(--bg-elevated)] font-medium text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        active
                          ? "text-indigo-500 dark:text-indigo-400"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]"
                      )}
                    />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="font-mono text-[10px] text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100">
                      {item.shortcut}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Projects Section */}
        <div>
          {!sidebarCollapsed && (
            <div className="mb-1.5 flex items-center justify-between px-2">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Projects
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {issues.length}
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setActiveProjectId("all")}
              title={sidebarCollapsed ? "All Projects" : undefined}
              className={cn(
                "flex w-full items-center rounded-md text-[13px] transition-colors",
                sidebarCollapsed
                  ? "h-8 justify-center px-0"
                  : "h-8 justify-between px-2",
                activeProjectId === "all"
                  ? "bg-[var(--bg-elevated)] font-medium text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-primary)]"
              )}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <FolderKanban className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                {!sidebarCollapsed && (
                  <span className="truncate">All Projects</span>
                )}
              </span>
              {!sidebarCollapsed && (
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {issues.length}
                </span>
              )}
            </button>

            {projects.map((project) => {
              const Icon = PROJECT_ICON_MAP[project.icon];
              const count = issues.filter(
                (i) => i.projectId === project.id
              ).length;
              const active = activeProjectId === project.id;

              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setActiveProjectId(project.id)}
                  title={sidebarCollapsed ? project.name : undefined}
                  className={cn(
                    "flex w-full items-center rounded-md text-[13px] transition-colors",
                    sidebarCollapsed
                      ? "h-8 justify-center px-0"
                      : "h-8 justify-between px-2",
                    active
                      ? "bg-[var(--bg-elevated)] font-medium text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--border-subtle)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/60 hover:text-[var(--text-primary)]"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
                      style={{
                        backgroundColor: `${project.color}20`,
                        color: project.color,
                      }}
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{project.name}</span>
                    )}
                  </span>
                  {!sidebarCollapsed && (
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Online Team Snapshot (when expanded) */}
        {!sidebarCollapsed && (
          <div>
            <div className="mb-1.5 flex items-center justify-between px-2">
              <span className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Team
              </span>
              <span className="text-[10.5px] text-emerald-600 dark:text-emerald-400">
                {members.filter((m) => m.status === "online").length} online
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1">
              {members.map((member) => (
                <MemberAvatar
                  key={member.id}
                  member={member}
                  size="sm"
                  showStatus
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Realtime Cross-Tab Sync Pill */}
      <div className={cn("px-2.5 pb-2", sidebarCollapsed && "px-2")}>
        {!sidebarCollapsed ? (
          <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-[11.5px] font-medium text-[var(--text-primary)]">
                  Live Sync
                </span>
              </div>
              <span className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400">
                {connectedTabs > 1 ? `${connectedTabs} tabs` : "Ready"}
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-[var(--text-muted)]">
              {connectedTabs > 1
                ? "Changes sync instantaneously across open tabs."
                : "Open a mirror tab to test real-time cross-tab sync."}
            </p>
            <button
              type="button"
              onClick={handleOpenMirrorTab}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)] py-1 text-[11px] font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
            >
              <ExternalLink className="h-3 w-3" />
              Open mirror tab
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenMirrorTab}
            title={`Live Sync (${connectedTabs} tab${connectedTabs > 1 ? "s" : ""}) — Click to open mirror tab`}
            className="flex h-8 w-full items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </button>
        )}
      </div>

      {/* Utility Footer */}
      <div className="border-t border-[var(--border-subtle)] p-2.5">
        {!sidebarCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={handleExportCsv}
                title="Export filtered issues as CSV"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <Download className="h-3 w-3" />
                CSV
              </button>
              <button
                type="button"
                onClick={handleExportJson}
                title="Export workspace snapshot as JSON"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-1.5 text-[11.5px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <Download className="h-3 w-3" />
                JSON
              </button>
              <button
                type="button"
                onClick={handleResetDemo}
                title="Reset demo data"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <MemberAvatar member={activeUser} size="sm" />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                    {activeUser?.name}
                  </div>
                  <div className="truncate text-[10.5px] text-[var(--text-muted)]">
                    Demo Workspace
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShortcutsModalOpen(true)}
                  title="Keyboard shortcuts (?)"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  <Keyboard className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme(isDark ? "light" : "dark")}
                  title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                >
                  {isDark ? (
                    <Sun className="h-3.5 w-3.5" />
                  ) : (
                    <Moon className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              title="Keyboard shortcuts (?)"
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            >
              <Keyboard className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
