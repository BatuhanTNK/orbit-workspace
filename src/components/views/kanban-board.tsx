"use client";

import { useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Issue, IssueStatus, Member, Project } from "@/types/workspace";
import { STATUS_LIST, STATUS_MAP, type StatusMeta } from "@/lib/constants";
import { useWorkspaceStore } from "@/store/workspace-store";
import { StatusIcon } from "@/components/icons/issue-icons";
import { KanbanCard } from "./kanban-card";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  statusMeta: StatusMeta;
  issues: Issue[];
  memberMap: Map<string, Member>;
  projectMap: Map<string, Project>;
  isOverColumn: boolean;
  onSelectIssue: (id: string) => void;
  onOpenCreate: (status: IssueStatus) => void;
  onQuickCreate: (status: IssueStatus, title: string) => void;
}

function KanbanColumn({
  statusMeta,
  issues,
  memberMap,
  projectMap,
  isOverColumn,
  onSelectIssue,
  onOpenCreate,
  onQuickCreate,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `col-${statusMeta.id}`,
    data: {
      type: "column",
      status: statusMeta.id,
    },
  });

  const [addingInline, setAddingInline] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");

  const totalPoints = issues.reduce((acc, i) => acc + i.estimate, 0);

  const handleInlineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTitle.trim()) {
      setAddingInline(false);
      return;
    }
    onQuickCreate(statusMeta.id, inlineTitle.trim());
    setInlineTitle("");
    setAddingInline(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[308px] shrink-0 flex-col rounded-2xl border transition-colors",
        isOverColumn
          ? "border-indigo-500/45 bg-indigo-500/[0.04]"
          : "border-[var(--border-subtle)] bg-[var(--bg-sidebar)]/55"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <StatusIcon status={statusMeta.id} className="h-4 w-4" />
          <h2 className="text-[12.5px] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
            {statusMeta.label}
          </h2>
          <span className="rounded-md bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-[var(--text-muted)]">
            {issues.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {totalPoints > 0 && (
            <span
              title="Total story points in column"
              className="font-mono text-[10.5px] text-[var(--text-muted)]"
            >
              {totalPoints}p
            </span>
          )}
          <button
            type="button"
            onClick={() => onOpenCreate(statusMeta.id)}
            title={`Create issue in ${statusMeta.label}`}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Column Card List */}
      <SortableContext
        items={issues.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
          {issues.length === 0 ? (
            <div className="flex h-24 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 text-center">
              <p className="text-[11.5px] text-[var(--text-muted)]">
                Drop an issue here
              </p>
            </div>
          ) : (
            issues.map((issue) => (
              <KanbanCard
                key={issue.id}
                issue={issue}
                member={
                  issue.assigneeId ? memberMap.get(issue.assigneeId) : undefined
                }
                project={projectMap.get(issue.projectId)}
                onSelect={onSelectIssue}
              />
            ))
          )}
        </div>
      </SortableContext>

      {/* Inline Quick-Add Footer */}
      <div className="p-2 pt-0">
        {addingInline ? (
          <form
            onSubmit={handleInlineSubmit}
            className="rounded-xl border border-indigo-500/40 bg-[var(--bg-surface)] p-2 shadow-sm"
          >
            <input
              autoFocus
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setInlineTitle("");
                  setAddingInline(false);
                }
              }}
              placeholder="Issue title… (Enter to save)"
              className="w-full bg-transparent text-[12.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInlineTitle("");
                  setAddingInline(false);
                }}
                className="rounded-md px-2 py-1 text-[11px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-indigo-500"
              >
                Add
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAddingInline(true)}
            className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add issue</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ issues }: { issues: Issue[] }) {
  const members = useWorkspaceStore((s) => s.members);
  const projects = useWorkspaceStore((s) => s.projects);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const moveIssue = useWorkspaceStore((s) => s.moveIssue);
  const createIssue = useWorkspaceStore((s) => s.createIssue);
  const setSelectedIssueId = useWorkspaceStore((s) => s.setSelectedIssueId);
  const openCreateModal = useWorkspaceStore((s) => s.openCreateModal);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<IssueStatus | null>(null);

  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const groupedIssues = useMemo(() => {
    const groups: Record<IssueStatus, Issue[]> = {
      backlog: [],
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const issue of issues) {
      groups[issue.status].push(issue);
    }
    for (const status of Object.keys(groups) as IssueStatus[]) {
      groups[status].sort((a, b) => a.order - b.order);
    }
    return groups;
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeIssue = activeDragId
    ? issues.find((i) => i.id === activeDragId) ?? null
    : null;

  const resolveStatusFromOverId = (overId: string): IssueStatus | null => {
    if (overId.startsWith("col-")) {
      return overId.replace("col-", "") as IssueStatus;
    }
    const targetIssue = issues.find((i) => i.id === overId);
    return targetIssue ? targetIssue.status : null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) {
      setOverStatus(null);
      return;
    }
    setOverStatus(resolveStatusFromOverId(String(event.over.id)));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverStatus(null);

    if (!over) return;

    const draggedId = String(active.id);
    const overId = String(over.id);
    const draggedIssue = issues.find((i) => i.id === draggedId);
    if (!draggedIssue) return;

    const targetStatus = resolveStatusFromOverId(overId);
    if (!targetStatus) return;

    let targetIndex: number | undefined;
    if (!overId.startsWith("col-")) {
      const columnItems = groupedIssues[targetStatus].filter(
        (i) => i.id !== draggedId
      );
      const idx = columnItems.findIndex((i) => i.id === overId);
      if (idx !== -1) targetIndex = idx;
    }

    const statusChanged = draggedIssue.status !== targetStatus;
    moveIssue(draggedId, targetStatus, targetIndex);

    if (statusChanged) {
      toast.success(`Moved ${draggedIssue.identifier}`, {
        description: `Status changed to ${STATUS_MAP[targetStatus].label}`,
      });
    }
  };

  const handleQuickCreate = (status: IssueStatus, title: string) => {
    const projectId =
      activeProjectId === "all" ? projects[0].id : activeProjectId;
    const created = createIssue({
      title,
      projectId,
      status,
      priority: "medium",
    });
    toast.success(`Created ${created.identifier}`, {
      description: created.title,
    });
  };

  return (
    <DndContext
      id="orbit-kanban-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-3.5 overflow-x-auto px-4 py-4 md:px-6">
        {STATUS_LIST.map((statusMeta) => (
          <KanbanColumn
            key={statusMeta.id}
            statusMeta={statusMeta}
            issues={groupedIssues[statusMeta.id]}
            memberMap={memberMap}
            projectMap={projectMap}
            isOverColumn={overStatus === statusMeta.id}
            onSelectIssue={setSelectedIssueId}
            onOpenCreate={openCreateModal}
            onQuickCreate={handleQuickCreate}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <div className="w-[292px]">
            <KanbanCard
              issue={activeIssue}
              member={
                activeIssue.assigneeId
                  ? memberMap.get(activeIssue.assigneeId)
                  : undefined
              }
              project={projectMap.get(activeIssue.projectId)}
              onSelect={() => {}}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
