"use client";

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/views/kanban-board";
import { ListView } from "@/components/views/list-view";
import { AnalyticsView } from "@/components/views/analytics-view";
import { IssueDrawer } from "@/components/overlays/issue-drawer";
import { CreateIssueModal } from "@/components/overlays/create-issue-modal";
import { CommandPalette } from "@/components/overlays/command-palette";
import { ShortcutsModal } from "@/components/overlays/shortcuts-modal";
import {
  selectFilteredIssues,
  useWorkspaceStore,
} from "@/store/workspace-store";
import { syncBridge } from "@/lib/sync";

function isTypingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable
  );
}

export function WorkspaceShell() {
  const issues = useWorkspaceStore((s) => s.issues);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const filters = useWorkspaceStore((s) => s.filters);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const selectedIssueId = useWorkspaceStore((s) => s.selectedIssueId);

  const hydrate = useWorkspaceStore((s) => s.hydrate);
  const applyRemoteSnapshot = useWorkspaceStore((s) => s.applyRemoteSnapshot);
  const setConnectedTabs = useWorkspaceStore((s) => s.setConnectedTabs);
  const setSelectedIssueId = useWorkspaceStore((s) => s.setSelectedIssueId);

  // 1. Hydrate localStorage & initialize BroadcastChannel cross-tab live sync
  useEffect(() => {
    hydrate();
    syncBridge.init();

    const unsubSnapshot = syncBridge.onRemoteSnapshot((snapshot, summary) => {
      applyRemoteSnapshot(snapshot, summary);
      toast.info("Live synced from another tab", {
        description: summary,
      });
    });

    const unsubPeers = syncBridge.onPeerCountChange((count) => {
      setConnectedTabs(count);
    });

    // Deep-link support: open ?issue=ORB-101 on initial load
    const params = new URLSearchParams(window.location.search);
    const linkedIdentifier = params.get("issue");
    if (linkedIdentifier) {
      const match = useWorkspaceStore
        .getState()
        .issues.find(
          (i) => i.identifier.toLowerCase() === linkedIdentifier.toLowerCase()
        );
      if (match) {
        setSelectedIssueId(match.id);
      }
    }

    return () => {
      unsubSnapshot();
      unsubPeers();
    };
  }, [hydrate, applyRemoteSnapshot, setConnectedTabs, setSelectedIssueId]);

  // 2. Keep URL query param (?issue=ORB-101) in sync with active Issue Drawer
  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHref = window.location.href;
    const url = new URL(currentHref);
    if (selectedIssueId) {
      const current = issues.find((i) => i.id === selectedIssueId);
      if (current) {
        url.searchParams.set("issue", current.identifier);
      }
    } else {
      url.searchParams.delete("issue");
    }
    const nextHref = url.toString();
    if (nextHref !== currentHref) {
      window.history.replaceState(window.history.state, "", nextHref);
    }
  }, [selectedIssueId, issues]);

  // 3. Global Linear-style keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const state = useWorkspaceStore.getState();

      // Cmd+K / Ctrl+K works everywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        state.setCommandPaletteOpen(!state.commandPaletteOpen);
        return;
      }

      // Escape dismisses topmost overlay
      if (e.key === "Escape") {
        if (state.commandPaletteOpen) {
          state.setCommandPaletteOpen(false);
        } else if (state.createModalOpen) {
          state.closeCreateModal();
        } else if (state.shortcutsModalOpen) {
          state.setShortcutsModalOpen(false);
        } else if (state.selectedIssueId) {
          state.setSelectedIssueId(null);
        } else if (state.selectedBulkIds.length > 0) {
          state.clearBulkSelect();
        }
        return;
      }

      // Single-key shortcuts only fire outside inputs/modals
      if (
        isTypingElement(e.target) ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        state.commandPaletteOpen ||
        state.createModalOpen
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "c") {
        e.preventDefault();
        state.openCreateModal("todo");
      } else if (key === "1") {
        e.preventDefault();
        state.setViewMode("board");
      } else if (key === "2") {
        e.preventDefault();
        state.setViewMode("list");
      } else if (key === "3") {
        e.preventDefault();
        state.setViewMode("analytics");
      } else if (key === "[") {
        e.preventDefault();
        state.setSidebarCollapsed(!state.sidebarCollapsed);
      } else if (e.key === "?") {
        e.preventDefault();
        state.setShortcutsModalOpen(!state.shortcutsModalOpen);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredIssues = useMemo(
    () => selectFilteredIssues(issues, activeProjectId, filters),
    [issues, activeProjectId, filters]
  );

  return (
    <div className="orbit-ambient-glow flex h-screen w-screen overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header filteredCount={filteredIssues.length} />

        <main className="relative flex-1 overflow-hidden">
          {viewMode === "board" && <KanbanBoard issues={filteredIssues} />}
          {viewMode === "list" && <ListView issues={filteredIssues} />}
          {viewMode === "analytics" && <AnalyticsView issues={filteredIssues} />}
        </main>
      </div>

      {/* Overlays & Modals */}
      <IssueDrawer />
      <CreateIssueModal />
      <CommandPalette />
      <ShortcutsModal />
    </div>
  );
}
