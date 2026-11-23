import type {
  IssuePriority,
  IssueStatus,
  Label,
  LabelId,
} from "@/types/workspace";

export interface StatusMeta {
  id: IssueStatus;
  label: string;
  shortLabel: string;
  color: string;
  accentBg: string;
  description: string;
}

export const STATUS_LIST: StatusMeta[] = [
  {
    id: "backlog",
    label: "Backlog",
    shortLabel: "Backlog",
    color: "#71717A",
    accentBg: "bg-zinc-500/10",
    description: "Triaged ideas and future cycle candidates",
  },
  {
    id: "todo",
    label: "Todo",
    shortLabel: "Todo",
    color: "#A1A1AA",
    accentBg: "bg-zinc-400/10",
    description: "Ready to pick up in the current cycle",
  },
  {
    id: "in_progress",
    label: "In Progress",
    shortLabel: "Active",
    color: "#F59E0B",
    accentBg: "bg-amber-500/10",
    description: "Currently being designed or engineered",
  },
  {
    id: "in_review",
    label: "In Review",
    shortLabel: "Review",
    color: "#818CF8",
    accentBg: "bg-indigo-500/10",
    description: "Pull request open or awaiting QA sign-off",
  },
  {
    id: "done",
    label: "Done",
    shortLabel: "Done",
    color: "#10B981",
    accentBg: "bg-emerald-500/10",
    description: "Shipped and verified in production",
  },
];

export const STATUS_MAP: Record<IssueStatus, StatusMeta> = Object.fromEntries(
  STATUS_LIST.map((s) => [s.id, s])
) as Record<IssueStatus, StatusMeta>;

export interface PriorityMeta {
  id: IssuePriority;
  label: string;
  rank: number;
  color: string;
  textClass: string;
}

export const PRIORITY_LIST: PriorityMeta[] = [
  {
    id: "urgent",
    label: "Urgent",
    rank: 4,
    color: "#F43F5E",
    textClass: "text-rose-500 dark:text-rose-400",
  },
  {
    id: "high",
    label: "High",
    rank: 3,
    color: "#F97316",
    textClass: "text-orange-500 dark:text-orange-400",
  },
  {
    id: "medium",
    label: "Medium",
    rank: 2,
    color: "#EAB308",
    textClass: "text-amber-500 dark:text-amber-400",
  },
  {
    id: "low",
    label: "Low",
    rank: 1,
    color: "#60A5FA",
    textClass: "text-sky-500 dark:text-sky-400",
  },
  {
    id: "none",
    label: "No Priority",
    rank: 0,
    color: "#71717A",
    textClass: "text-zinc-400 dark:text-zinc-500",
  },
];

export const PRIORITY_MAP: Record<IssuePriority, PriorityMeta> =
  Object.fromEntries(PRIORITY_LIST.map((p) => [p.id, p])) as Record<
    IssuePriority,
    PriorityMeta
  >;

export const LABEL_LIST: Label[] = [
  {
    id: "feature",
    name: "Feature",
    color: "#818CF8",
    bgClass: "bg-indigo-500/10 border-indigo-500/20",
    textClass: "text-indigo-600 dark:text-indigo-300",
    dotClass: "bg-indigo-500",
  },
  {
    id: "bug",
    name: "Bug",
    color: "#F43F5E",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    textClass: "text-rose-600 dark:text-rose-300",
    dotClass: "bg-rose-500",
  },
  {
    id: "design",
    name: "Design",
    color: "#C084FC",
    bgClass: "bg-purple-500/10 border-purple-500/20",
    textClass: "text-purple-600 dark:text-purple-300",
    dotClass: "bg-purple-500",
  },
  {
    id: "performance",
    name: "Performance",
    color: "#F59E0B",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    textClass: "text-amber-700 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  {
    id: "infra",
    name: "Infra",
    color: "#38BDF8",
    bgClass: "bg-sky-500/10 border-sky-500/20",
    textClass: "text-sky-700 dark:text-sky-300",
    dotClass: "bg-sky-500",
  },
  {
    id: "security",
    name: "Security",
    color: "#10B981",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    textClass: "text-emerald-700 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
  {
    id: "docs",
    name: "Docs",
    color: "#94A3B8",
    bgClass: "bg-slate-500/10 border-slate-500/20",
    textClass: "text-slate-600 dark:text-slate-300",
    dotClass: "bg-slate-400",
  },
];

export const LABEL_MAP: Record<LabelId, Label> = Object.fromEntries(
  LABEL_LIST.map((l) => [l.id, l])
) as Record<LabelId, Label>;

export const ESTIMATE_OPTIONS = [1, 2, 3, 5, 8] as const;
