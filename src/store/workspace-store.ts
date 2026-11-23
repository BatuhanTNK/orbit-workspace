import { create } from "zustand";
import type {
  ActivityEvent,
  FilterState,
  Issue,
  IssuePriority,
  IssueStatus,
  LabelId,
  Member,
  Project,
  ViewMode,
  WorkspaceSnapshot,
} from "@/types/workspace";
import { createSeedSnapshot } from "@/lib/seed-data";
import {
  clearStoredSnapshot,
  loadStoredSnapshot,
  saveStoredSnapshot,
  syncBridge,
} from "@/lib/sync";
import { generateId } from "@/lib/utils";
import { PRIORITY_MAP, STATUS_MAP } from "@/lib/constants";

export interface CreateIssueInput {
  title: string;
  description?: string;
  projectId: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  labels?: LabelId[];
  estimate?: number;
  dueDate?: string | null;
}

const DEFAULT_FILTERS: FilterState = {
  search: "",
  priorities: [],
  labels: [],
  assigneeIds: [],
  statuses: [],
};

const CURRENT_ACTOR_ID = "m-1"; // Alex Rivera (demo logged-in engineer)

interface WorkspaceStore {
  // Core domain data
  hydrated: boolean;
  projects: Project[];
  members: Member[];
  issues: Issue[];
  activities: ActivityEvent[];
  nextIssueNumbers: Record<string, number>;

  // Navigation & UI state
  activeProjectId: string | "all";
  viewMode: ViewMode;
  selectedIssueId: string | null;
  selectedBulkIds: string[];
  filters: FilterState;
  sidebarCollapsed: boolean;
  createModalOpen: boolean;
  createModalDefaultStatus: IssueStatus;
  commandPaletteOpen: boolean;
  shortcutsModalOpen: boolean;

  // Realtime cross-tab sync status
  connectedTabs: number;
  lastSyncedAt: string | null;
  clientNowMs: number | null;

  // Lifecycle & persistence
  hydrate: () => void;
  applyRemoteSnapshot: (snapshot: WorkspaceSnapshot, summary: string) => void;
  setConnectedTabs: (count: number) => void;
  resetDemoData: () => void;
  getSnapshot: () => WorkspaceSnapshot;

  // Navigation setters
  setActiveProjectId: (projectId: string | "all") => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedIssueId: (issueId: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openCreateModal: (defaultStatus?: IssueStatus) => void;
  closeCreateModal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;

  // Filters
  setSearch: (search: string) => void;
  togglePriorityFilter: (priority: IssuePriority) => void;
  toggleLabelFilter: (label: LabelId) => void;
  toggleAssigneeFilter: (assigneeId: string) => void;
  toggleStatusFilter: (status: IssueStatus) => void;
  clearFilters: () => void;

  // Bulk selection (List view)
  toggleBulkSelect: (issueId: string) => void;
  selectAllBulk: (issueIds: string[]) => void;
  clearBulkSelect: () => void;
  bulkUpdateStatus: (status: IssueStatus) => void;
  bulkUpdatePriority: (priority: IssuePriority) => void;
  bulkDeleteIssues: () => void;

  // Issue CRUD & DnD
  createIssue: (input: CreateIssueInput) => Issue;
  updateIssue: (
    issueId: string,
    patch: Partial<
      Pick<
        Issue,
        | "title"
        | "description"
        | "status"
        | "priority"
        | "assigneeId"
        | "labels"
        | "estimate"
        | "dueDate"
        | "projectId"
      >
    >
  ) => void;
  deleteIssue: (issueId: string) => Issue | null;
  restoreIssue: (issue: Issue) => void;
  moveIssue: (
    issueId: string,
    targetStatus: IssueStatus,
    targetIndex?: number
  ) => void;

  // Subtasks & Comments
  addSubtask: (issueId: string, title: string) => void;
  toggleSubtask: (issueId: string, subtaskId: string) => void;
  deleteSubtask: (issueId: string, subtaskId: string) => void;
  addComment: (issueId: string, body: string) => void;
}

function buildSnapshot(state: WorkspaceStore): WorkspaceSnapshot {
  return {
    projects: state.projects,
    members: state.members,
    issues: state.issues,
    activities: state.activities,
    nextIssueNumbers: state.nextIssueNumbers,
    updatedAt: new Date().toISOString(),
  };
}

function persistAndBroadcast(state: WorkspaceStore, summary: string) {
  const snapshot = buildSnapshot(state);
  saveStoredSnapshot(snapshot);
  syncBridge.broadcastSnapshot(snapshot, summary);
}

const initialSeed = createSeedSnapshot();

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  hydrated: false,
  projects: initialSeed.projects,
  members: initialSeed.members,
  issues: initialSeed.issues,
  activities: initialSeed.activities,
  nextIssueNumbers: initialSeed.nextIssueNumbers,

  activeProjectId: "all",
  viewMode: "board",
  selectedIssueId: null,
  selectedBulkIds: [],
  filters: DEFAULT_FILTERS,
  sidebarCollapsed: false,
  createModalOpen: false,
  createModalDefaultStatus: "todo",
  commandPaletteOpen: false,
  shortcutsModalOpen: false,

  connectedTabs: 1,
  lastSyncedAt: null,
  clientNowMs: null,

  hydrate: () => {
    const nowMs = Date.now();
    const stored = loadStoredSnapshot();
    if (stored) {
      set({
        projects: stored.projects,
        members: stored.members,
        issues: stored.issues,
        activities: stored.activities,
        nextIssueNumbers: stored.nextIssueNumbers,
        hydrated: true,
        lastSyncedAt: stored.updatedAt,
        clientNowMs: nowMs,
      });
    } else {
      const fresh = createSeedSnapshot(nowMs);
      saveStoredSnapshot(fresh);
      set({
        projects: fresh.projects,
        members: fresh.members,
        issues: fresh.issues,
        activities: fresh.activities,
        nextIssueNumbers: fresh.nextIssueNumbers,
        hydrated: true,
        lastSyncedAt: fresh.updatedAt,
        clientNowMs: nowMs,
      });
    }
  },

  applyRemoteSnapshot: (snapshot, summary) => {
    const remoteEvent: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      action: "synced",
      detail: summary,
      createdAt: new Date().toISOString(),
      source: "remote",
    };

    const existingActivities = snapshot.activities ?? [];
    const mergedActivities =
      existingActivities[0]?.detail === summary
        ? existingActivities
        : [remoteEvent, ...existingActivities].slice(0, 40);

    set({
      projects: snapshot.projects,
      members: snapshot.members,
      issues: snapshot.issues,
      activities: mergedActivities,
      nextIssueNumbers: snapshot.nextIssueNumbers,
      lastSyncedAt: snapshot.updatedAt,
    });
  },

  setConnectedTabs: (count) => set({ connectedTabs: count }),

  resetDemoData: () => {
    clearStoredSnapshot();
    const nowMs = Date.now();
    const fresh = createSeedSnapshot(nowMs);
    saveStoredSnapshot(fresh);
    set({
      projects: fresh.projects,
      members: fresh.members,
      issues: fresh.issues,
      activities: fresh.activities,
      nextIssueNumbers: fresh.nextIssueNumbers,
      activeProjectId: "all",
      selectedIssueId: null,
      selectedBulkIds: [],
      filters: DEFAULT_FILTERS,
      lastSyncedAt: fresh.updatedAt,
      clientNowMs: nowMs,
    });
    syncBridge.broadcastSnapshot(fresh, "Reset workspace to default demo data");
  },

  getSnapshot: () => buildSnapshot(get()),

  setActiveProjectId: (projectId) =>
    set({ activeProjectId: projectId, selectedBulkIds: [] }),
  setViewMode: (mode) => set({ viewMode: mode, selectedBulkIds: [] }),
  setSelectedIssueId: (issueId) => set({ selectedIssueId: issueId }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  openCreateModal: (defaultStatus = "todo") =>
    set({ createModalOpen: true, createModalDefaultStatus: defaultStatus }),
  closeCreateModal: () => set({ createModalOpen: false }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),

  setSearch: (search) =>
    set((s) => ({ filters: { ...s.filters, search } })),

  togglePriorityFilter: (priority) =>
    set((s) => {
      const exists = s.filters.priorities.includes(priority);
      return {
        filters: {
          ...s.filters,
          priorities: exists
            ? s.filters.priorities.filter((p) => p !== priority)
            : [...s.filters.priorities, priority],
        },
      };
    }),

  toggleLabelFilter: (label) =>
    set((s) => {
      const exists = s.filters.labels.includes(label);
      return {
        filters: {
          ...s.filters,
          labels: exists
            ? s.filters.labels.filter((l) => l !== label)
            : [...s.filters.labels, label],
        },
      };
    }),

  toggleAssigneeFilter: (assigneeId) =>
    set((s) => {
      const exists = s.filters.assigneeIds.includes(assigneeId);
      return {
        filters: {
          ...s.filters,
          assigneeIds: exists
            ? s.filters.assigneeIds.filter((a) => a !== assigneeId)
            : [...s.filters.assigneeIds, assigneeId],
        },
      };
    }),

  toggleStatusFilter: (status) =>
    set((s) => {
      const exists = s.filters.statuses.includes(status);
      return {
        filters: {
          ...s.filters,
          statuses: exists
            ? s.filters.statuses.filter((st) => st !== status)
            : [...s.filters.statuses, status],
        },
      };
    }),

  clearFilters: () => set({ filters: DEFAULT_FILTERS }),

  toggleBulkSelect: (issueId) =>
    set((s) => ({
      selectedBulkIds: s.selectedBulkIds.includes(issueId)
        ? s.selectedBulkIds.filter((id) => id !== issueId)
        : [...s.selectedBulkIds, issueId],
    })),

  selectAllBulk: (issueIds) => set({ selectedBulkIds: issueIds }),
  clearBulkSelect: () => set({ selectedBulkIds: [] }),

  bulkUpdateStatus: (status) => {
    const ids = new Set(get().selectedBulkIds);
    if (ids.size === 0) return;
    const now = new Date().toISOString();

    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      action: status === "done" ? "completed" : "moved",
      detail: `Bulk moved ${ids.size} issue${ids.size > 1 ? "s" : ""} → ${STATUS_MAP[status].label}`,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: s.issues.map((issue) =>
        ids.has(issue.id) ? { ...issue, status, updatedAt: now } : issue
      ),
      activities: [event, ...s.activities].slice(0, 40),
      selectedBulkIds: [],
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), event.detail);
  },

  bulkUpdatePriority: (priority) => {
    const ids = new Set(get().selectedBulkIds);
    if (ids.size === 0) return;
    const now = new Date().toISOString();

    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      action: "updated",
      detail: `Set priority to ${PRIORITY_MAP[priority].label} on ${ids.size} issue${ids.size > 1 ? "s" : ""}`,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: s.issues.map((issue) =>
        ids.has(issue.id) ? { ...issue, priority, updatedAt: now } : issue
      ),
      activities: [event, ...s.activities].slice(0, 40),
      selectedBulkIds: [],
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), event.detail);
  },

  bulkDeleteIssues: () => {
    const ids = new Set(get().selectedBulkIds);
    if (ids.size === 0) return;
    const now = new Date().toISOString();

    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      action: "deleted",
      detail: `Deleted ${ids.size} selected issue${ids.size > 1 ? "s" : ""}`,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: s.issues.filter((issue) => !ids.has(issue.id)),
      selectedIssueId:
        s.selectedIssueId && ids.has(s.selectedIssueId)
          ? null
          : s.selectedIssueId,
      activities: [event, ...s.activities].slice(0, 40),
      selectedBulkIds: [],
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), event.detail);
  },

  createIssue: (input) => {
    const state = get();
    const project =
      state.projects.find((p) => p.id === input.projectId) ?? state.projects[0];
    const nextNum = state.nextIssueNumbers[project.id] ?? 100;
    const identifier = `${project.key}-${nextNum}`;
    const status = input.status ?? "todo";
    const now = new Date().toISOString();

    const sameColumnCount = state.issues.filter(
      (i) => i.status === status
    ).length;

    const newIssue: Issue = {
      id: generateId("iss"),
      identifier,
      projectId: project.id,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      status,
      priority: input.priority ?? "medium",
      assigneeId: input.assigneeId ?? null,
      labels: input.labels ?? ["feature"],
      subtasks: [],
      comments: [],
      estimate: input.estimate ?? 3,
      dueDate: input.dueDate ?? null,
      order: sameColumnCount,
      createdAt: now,
      updatedAt: now,
    };

    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      issueIdentifier: identifier,
      issueTitle: newIssue.title,
      action: "created",
      detail: `Created ${identifier} in ${STATUS_MAP[status].label}`,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: [newIssue, ...s.issues],
      nextIssueNumbers: {
        ...s.nextIssueNumbers,
        [project.id]: nextNum + 1,
      },
      activities: [event, ...s.activities].slice(0, 40),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), `Created ${identifier}: ${newIssue.title}`);
    return newIssue;
  },

  updateIssue: (issueId, patch) => {
    const existing = get().issues.find((i) => i.id === issueId);
    if (!existing) return;

    const now = new Date().toISOString();
    let detail = `Updated ${existing.identifier}`;
    let action: ActivityEvent["action"] = "updated";

    if (patch.status && patch.status !== existing.status) {
      action = patch.status === "done" ? "completed" : "moved";
      detail =
        patch.status === "done"
          ? `Marked ${existing.identifier} as Done`
          : `Moved ${existing.identifier} → ${STATUS_MAP[patch.status].label}`;
    } else if (patch.priority && patch.priority !== existing.priority) {
      detail = `Changed ${existing.identifier} priority to ${PRIORITY_MAP[patch.priority].label}`;
    }

    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      issueIdentifier: existing.identifier,
      issueTitle: patch.title ?? existing.title,
      action,
      detail,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: s.issues.map((issue) =>
        issue.id === issueId
          ? { ...issue, ...patch, updatedAt: now }
          : issue
      ),
      activities: [event, ...s.activities].slice(0, 40),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), detail);
  },

  deleteIssue: (issueId) => {
    const existing = get().issues.find((i) => i.id === issueId);
    if (!existing) return null;

    const now = new Date().toISOString();
    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      issueIdentifier: existing.identifier,
      issueTitle: existing.title,
      action: "deleted",
      detail: `Deleted ${existing.identifier}`,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: s.issues.filter((i) => i.id !== issueId),
      selectedIssueId: s.selectedIssueId === issueId ? null : s.selectedIssueId,
      selectedBulkIds: s.selectedBulkIds.filter((id) => id !== issueId),
      activities: [event, ...s.activities].slice(0, 40),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), event.detail);
    return existing;
  },

  restoreIssue: (issue) => {
    const now = new Date().toISOString();
    set((s) => ({
      issues: [issue, ...s.issues],
      lastSyncedAt: now,
    }));
    persistAndBroadcast(get(), `Restored ${issue.identifier}`);
  },

  moveIssue: (issueId, targetStatus, targetIndex) => {
    const state = get();
    const moving = state.issues.find((i) => i.id === issueId);
    if (!moving) return;

    const statusChanged = moving.status !== targetStatus;
    const now = new Date().toISOString();

    // Group remaining issues in target column sorted by current order
    const targetColumnIssues = state.issues
      .filter((i) => i.status === targetStatus && i.id !== issueId)
      .sort((a, b) => a.order - b.order);

    const insertAt =
      typeof targetIndex === "number"
        ? Math.max(0, Math.min(targetIndex, targetColumnIssues.length))
        : targetColumnIssues.length;

    const updatedMoving: Issue = {
      ...moving,
      status: targetStatus,
      updatedAt: now,
    };

    targetColumnIssues.splice(insertAt, 0, updatedMoving);

    const reindexedMap = new Map<string, Issue>();
    targetColumnIssues.forEach((item, idx) => {
      reindexedMap.set(item.id, { ...item, order: idx });
    });

    const nextIssues = state.issues.map((item) => {
      if (reindexedMap.has(item.id)) {
        return reindexedMap.get(item.id)!;
      }
      return item;
    });

    let nextActivities = state.activities;
    let summary = `Reordered ${moving.identifier} in ${STATUS_MAP[targetStatus].label}`;

    if (statusChanged) {
      summary =
        targetStatus === "done"
          ? `Completed ${moving.identifier}`
          : `Moved ${moving.identifier} → ${STATUS_MAP[targetStatus].label}`;

      const event: ActivityEvent = {
        id: generateId("act"),
        actorId: CURRENT_ACTOR_ID,
        issueIdentifier: moving.identifier,
        issueTitle: moving.title,
        action: targetStatus === "done" ? "completed" : "moved",
        detail: `Moved from ${STATUS_MAP[moving.status].label} → ${STATUS_MAP[targetStatus].label}`,
        createdAt: now,
        source: "local",
      };
      nextActivities = [event, ...state.activities].slice(0, 40);
    }

    set({
      issues: nextIssues,
      activities: nextActivities,
      lastSyncedAt: now,
    });

    persistAndBroadcast(get(), summary);
  },

  addSubtask: (issueId, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const issue = get().issues.find((i) => i.id === issueId);
    if (!issue) return;

    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              subtasks: [
                ...i.subtasks,
                { id: generateId("st"), title: trimmed, completed: false },
              ],
              updatedAt: now,
            }
          : i
      ),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), `Added subtask to ${issue.identifier}`);
  },

  toggleSubtask: (issueId, subtaskId) => {
    const now = new Date().toISOString();
    const issue = get().issues.find((i) => i.id === issueId);
    if (!issue) return;

    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              subtasks: i.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, completed: !st.completed } : st
              ),
              updatedAt: now,
            }
          : i
      ),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), `Updated checklist in ${issue.identifier}`);
  },

  deleteSubtask: (issueId, subtaskId) => {
    const now = new Date().toISOString();
    const issue = get().issues.find((i) => i.id === issueId);
    if (!issue) return;

    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              subtasks: i.subtasks.filter((st) => st.id !== subtaskId),
              updatedAt: now,
            }
          : i
      ),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), `Removed subtask from ${issue.identifier}`);
  },

  addComment: (issueId, body) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    const now = new Date().toISOString();
    const issue = get().issues.find((i) => i.id === issueId);
    if (!issue) return;

    const event: ActivityEvent = {
      id: generateId("act"),
      actorId: CURRENT_ACTOR_ID,
      issueIdentifier: issue.identifier,
      issueTitle: issue.title,
      action: "commented",
      detail: trimmed.length > 68 ? `${trimmed.slice(0, 68)}…` : trimmed,
      createdAt: now,
      source: "local",
    };

    set((s) => ({
      issues: s.issues.map((i) =>
        i.id === issueId
          ? {
              ...i,
              comments: [
                ...i.comments,
                {
                  id: generateId("c"),
                  authorId: CURRENT_ACTOR_ID,
                  body: trimmed,
                  createdAt: now,
                },
              ],
              updatedAt: now,
            }
          : i
      ),
      activities: [event, ...s.activities].slice(0, 40),
      lastSyncedAt: now,
    }));

    persistAndBroadcast(get(), `Commented on ${issue.identifier}`);
  },
}));

/**
 * Pure selector helper to compute filtered issues for current project + active filters.
 */
export function selectFilteredIssues(
  issues: Issue[],
  activeProjectId: string | "all",
  filters: FilterState
): Issue[] {
  const query = filters.search.trim().toLowerCase();

  return issues.filter((issue) => {
    if (activeProjectId !== "all" && issue.projectId !== activeProjectId) {
      return false;
    }
    if (
      filters.priorities.length > 0 &&
      !filters.priorities.includes(issue.priority)
    ) {
      return false;
    }
    if (
      filters.statuses.length > 0 &&
      !filters.statuses.includes(issue.status)
    ) {
      return false;
    }
    if (
      filters.assigneeIds.length > 0 &&
      !filters.assigneeIds.includes(issue.assigneeId ?? "unassigned")
    ) {
      return false;
    }
    if (
      filters.labels.length > 0 &&
      !filters.labels.some((l) => issue.labels.includes(l))
    ) {
      return false;
    }
    if (query) {
      const hay =
        `${issue.identifier} ${issue.title} ${issue.description} ${issue.labels.join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}
