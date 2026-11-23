import type { IssuePriority, IssueStatus, Member } from "@/types/workspace";
import { cn } from "@/lib/utils";

export function StatusIcon({
  status,
  className = "h-3.5 w-3.5",
}: {
  status: IssueStatus;
  className?: string;
}) {
  switch (status) {
    case "backlog":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="#71717A"
            strokeWidth="1.5"
            strokeDasharray="2.2 2.2"
          />
        </svg>
      );
    case "todo":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="#A1A1AA" strokeWidth="1.5" />
        </svg>
      );
    case "in_progress":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M8 4.2A3.8 3.8 0 0 1 8 11.8V4.2Z" fill="#F59E0B" />
        </svg>
      );
    case "in_review":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <circle cx="8" cy="8" r="6" stroke="#818CF8" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2.75" fill="#818CF8" />
        </svg>
      );
    case "done":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <circle cx="8" cy="8" r="6.5" fill="#10B981" />
          <path
            d="M5.2 8.15L7.1 10.05L11.05 6.1"
            stroke="white"
            strokeWidth="1.65"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function PriorityIcon({
  priority,
  className = "h-3.5 w-3.5",
}: {
  priority: IssuePriority;
  className?: string;
}) {
  switch (priority) {
    case "urgent":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <rect x="1.75" y="1.75" width="12.5" height="12.5" rx="3" fill="#F43F5E" />
          <path
            d="M8 4.75V8.65"
            stroke="white"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <circle cx="8" cy="11.25" r="0.95" fill="white" />
        </svg>
      );
    case "high":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <rect x="2.25" y="9.5" width="2.5" height="4.25" rx="0.8" fill="#F97316" />
          <rect x="6.75" y="6.25" width="2.5" height="7.5" rx="0.8" fill="#F97316" />
          <rect x="11.25" y="2.75" width="2.5" height="11" rx="0.8" fill="#F97316" />
        </svg>
      );
    case "medium":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <rect x="2.25" y="9.5" width="2.5" height="4.25" rx="0.8" fill="#EAB308" />
          <rect x="6.75" y="6.25" width="2.5" height="7.5" rx="0.8" fill="#EAB308" />
          <rect
            x="11.25"
            y="2.75"
            width="2.5"
            height="11"
            rx="0.8"
            fill="currentColor"
            className="text-zinc-300 dark:text-zinc-700"
          />
        </svg>
      );
    case "low":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0", className)} aria-hidden="true">
          <rect x="2.25" y="9.5" width="2.5" height="4.25" rx="0.8" fill="#60A5FA" />
          <rect
            x="6.75"
            y="6.25"
            width="2.5"
            height="7.5"
            rx="0.8"
            fill="currentColor"
            className="text-zinc-300 dark:text-zinc-700"
          />
          <rect
            x="11.25"
            y="2.75"
            width="2.5"
            height="11"
            rx="0.8"
            fill="currentColor"
            className="text-zinc-300 dark:text-zinc-700"
          />
        </svg>
      );
    case "none":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={cn("shrink-0 text-zinc-400 dark:text-zinc-600", className)} aria-hidden="true">
          <rect x="2.5" y="7.25" width="2.5" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="6.75" y="7.25" width="2.5" height="1.5" rx="0.75" fill="currentColor" />
          <rect x="11" y="7.25" width="2.5" height="1.5" rx="0.75" fill="currentColor" />
        </svg>
      );
  }
}

export function MemberAvatar({
  member,
  size = "sm",
  showStatus = false,
}: {
  member: Member | null | undefined;
  size?: "xs" | "sm" | "md";
  showStatus?: boolean;
}) {
  const sizeClasses = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-6 w-6 text-[10px]",
    md: "h-7 w-7 text-[11px]",
  }[size];

  if (!member) {
    return (
      <div
        title="Unassigned"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-400/50 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500",
          sizeClasses
        )}
      >
        —
      </div>
    );
  }

  return (
    <div className="relative inline-flex shrink-0" title={`${member.name} · ${member.role}`}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-1 ring-black/10 dark:ring-white/15",
          member.avatarColor,
          sizeClasses
        )}
      >
        {member.initials}
      </div>
      {showStatus && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-[var(--bg-sidebar)]",
            member.status === "online"
              ? "bg-emerald-500"
              : member.status === "away"
                ? "bg-amber-400"
                : "bg-zinc-500"
          )}
        />
      )}
    </div>
  );
}
