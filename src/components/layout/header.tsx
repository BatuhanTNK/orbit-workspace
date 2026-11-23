"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Check,
  Columns3,
  ListTodo,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { LABEL_LIST, PRIORITY_LIST } from "@/lib/constants";
import { MemberAvatar, PriorityIcon } from "@/components/icons/issue-icons";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/types/workspace";

export function Header({ filteredCount }: { filteredCount: number }) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const projects = useWorkspaceStore((s) => s.projects);
  const members = useWorkspaceStore((s) => s.members);
  const activeProjectId = useWorkspaceStore((s) => s.activeProjectId);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const filters = useWorkspaceStore((s) => s.filters);

  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const setSearch = useWorkspaceStore((s) => s.setSearch);
  const togglePriorityFilter = useWorkspaceStore((s) => s.togglePriorityFilter);
  const toggleLabelFilter = useWorkspaceStore((s) => s.toggleLabelFilter);
  const toggleAssigneeFilter = useWorkspaceStore((s) => s.toggleAssigneeFilter);
  const clearFilters = useWorkspaceStore((s) => s.clearFilters);
  const openCreateModal = useWorkspaceStore((s) => s.openCreateModal);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    }
    if (filterMenuOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [filterMenuOpen]);

  const activeProject =
    activeProjectId === "all"
      ? null
      : projects.find((p) => p.id === activeProjectId) ?? null;

  const activeFilterCount =
    filters.priorities.length +
    filters.labels.length +
    filters.assigneeIds.length +
    filters.statuses.length;

  const hasAnyFilter = activeFilterCount > 0 || filters.search.trim().length > 0;

  const views: { id: ViewMode; label: string; icon: typeof Columns3 }[] = [
    { id: "board", label: "Board", icon: Columns3 },
    { id: "list", label: "List", icon: ListTodo },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/85 backdrop-blur-md">
      {/* Row 1: Breadcrumb + View Switcher + Primary CTA */}
      <div className="flex h-13 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {activeProject ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: activeProject.color }}
            />
          ) : (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
          )}
          <h1 className="truncate text-[14px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
            {activeProject ? activeProject.name : "All Projects"}
          </h1>
          <span className="hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)] sm:inline-flex">
            {filteredCount} {filteredCount === 1 ? "issue" : "issues"}
          </span>
          {activeProject && (
            <span className="hidden truncate text-[12px] text-[var(--text-muted)] lg:inline">
              · {activeProject.cycleName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented View Switcher */}
          <div className="inline-flex items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-0.5">
            {views.map((v) => {
              const Icon = v.icon;
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-all",
                    active
                      ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm ring-1 ring-[var(--border-subtle)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => openCreateModal("todo")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 text-[12.5px] font-medium text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-500 active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>

      {/* Row 2: Search & Filter Bar (shown on Board & List views) */}
      {viewMode !== "analytics" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] px-4 py-2 md:px-6">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            {/* Inline Search */}
            <div className="relative w-full max-w-[260px]">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by ID, title, label…"
                aria-label="Filter issues"
                className="h-7 w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] pl-8 pr-7 text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              />
              {filters.search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Filter Popover Button */}
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterMenuOpen((o) => !o)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[12px] font-medium transition-colors",
                  activeFilterCount > 0
                    ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                )}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="rounded bg-indigo-500 px-1.5 py-0.2 font-mono text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filterMenuOpen && (
                <div className="absolute left-0 top-9 z-40 w-[300px] rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 shadow-2xl">
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[11.5px] font-semibold text-[var(--text-primary)]">
                      Filter Issues
                    </span>
                    {hasAnyFilter && (
                      <button
                        type="button"
                        onClick={() => {
                          clearFilters();
                        }}
                        className="text-[11px] text-indigo-500 hover:underline"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  {/* Priority Section */}
                  <div className="mb-3">
                    <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Priority
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {PRIORITY_LIST.map((p) => {
                        const selected = filters.priorities.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePriorityFilter(p.id)}
                            className={cn(
                              "flex items-center justify-between rounded-md px-2 py-1 text-[12px] transition-colors",
                              selected
                                ? "bg-indigo-500/15 text-[var(--text-primary)] ring-1 ring-indigo-500/30"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <PriorityIcon priority={p.id} className="h-3.5 w-3.5" />
                              {p.label}
                            </span>
                            {selected && <Check className="h-3 w-3 text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Labels Section */}
                  <div className="mb-3">
                    <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Labels
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {LABEL_LIST.map((label) => {
                        const selected = filters.labels.includes(label.id);
                        return (
                          <button
                            key={label.id}
                            type="button"
                            onClick={() => toggleLabelFilter(label.id)}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all",
                              selected
                                ? `${label.bgClass} ${label.textClass} ring-1 ring-current/30`
                                : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", label.dotClass)} />
                            {label.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assignee Section */}
                  <div>
                    <div className="mb-1.5 text-[10.5px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                      Assignee
                    </div>
                    <div className="space-y-0.5">
                      {members.map((member) => {
                        const selected = filters.assigneeIds.includes(member.id);
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => toggleAssigneeFilter(member.id)}
                            className={cn(
                              "flex w-full items-center justify-between rounded-md px-2 py-1 text-[12px] transition-colors",
                              selected
                                ? "bg-indigo-500/15 text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                            )}
                          >
                            <span className="flex items-center gap-2">
                              <MemberAvatar member={member} size="xs" />
                              <span>{member.name}</span>
                            </span>
                            {selected && <Check className="h-3 w-3 text-indigo-500" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Filter Pills */}
            {filters.priorities.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => togglePriorityFilter(p)}
                className="inline-flex h-6 items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <PriorityIcon priority={p} className="h-3 w-3" />
                <span className="capitalize">{p}</span>
                <X className="h-2.5 w-2.5 text-[var(--text-muted)]" />
              </button>
            ))}

            {filters.labels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleLabelFilter(l)}
                className="inline-flex h-6 items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 text-[11px] capitalize text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <span>{l}</span>
                <X className="h-2.5 w-2.5 text-[var(--text-muted)]" />
              </button>
            ))}

            {filters.assigneeIds.map((id) => {
              const member = members.find((m) => m.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAssigneeFilter(id)}
                  className="inline-flex h-6 items-center gap-1 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  <MemberAvatar member={member} size="xs" />
                  <span>{member?.name.split(" ")[0] ?? "Unassigned"}</span>
                  <X className="h-2.5 w-2.5 text-[var(--text-muted)]" />
                </button>
              );
            })}

            {hasAnyFilter && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11.5px] font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
              >
                Reset
              </button>
            )}
          </div>

          <div className="hidden items-center gap-2 text-[11px] text-[var(--text-muted)] xl:flex">
            <span>Press</span>
            <span className="kbd">⌘K</span>
            <span>for commands ·</span>
            <span className="kbd">C</span>
            <span>new issue ·</span>
            <span className="kbd">?</span>
            <span>shortcuts</span>
          </div>
        </div>
      )}
    </header>
  );
}
