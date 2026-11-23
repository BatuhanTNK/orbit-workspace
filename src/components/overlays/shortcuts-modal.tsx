"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Keyboard, X } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";

const SHORTCUT_GROUPS = [
  {
    title: "Global Actions",
    items: [
      { keys: ["⌘", "K"], label: "Open Command Palette" },
      { keys: ["C"], label: "Create new issue" },
      { keys: ["?"], label: "Toggle keyboard shortcuts" },
      { keys: ["["], label: "Collapse / expand sidebar" },
      { keys: ["Esc"], label: "Close active modal or drawer" },
    ],
  },
  {
    title: "Navigation & Editing",
    items: [
      { keys: ["1"], label: "Switch to Kanban Board" },
      { keys: ["2"], label: "Switch to List & Triage" },
      { keys: ["3"], label: "Switch to Sprint Analytics" },
      { keys: ["⌘", "↵"], label: "Submit modal or post comment" },
    ],
  },
];

export function ShortcutsModal() {
  const open = useWorkspaceStore((s) => s.shortcutsModalOpen);
  const setOpen = useWorkspaceStore((s) => s.setShortcutsModalOpen);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/55 backdrop-blur-[2px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="relative z-10 w-full max-w-[540px] overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-indigo-500" />
                <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title} className="space-y-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {group.title}
                  </div>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 text-[12.5px]"
                      >
                        <span className="text-[var(--text-secondary)]">
                          {item.label}
                        </span>
                        <span className="flex items-center gap-1">
                          {item.keys.map((k) => (
                            <span key={k} className="kbd">
                              {k}
                            </span>
                          ))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
