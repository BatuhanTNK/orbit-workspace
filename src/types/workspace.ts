export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done";

export type IssuePriority = "urgent" | "high" | "medium" | "low" | "none";

export type ViewMode = "board" | "list" | "analytics";

export type LabelId =
  | "feature"
  | "bug"
  | "design"
  | "performance"
  | "infra"
  | "security"
  | "docs";

export interface Label {
  id: LabelId;
  name: string;
  color: string;
  bgClass: string;
  textClass: string;
  dotClass: string;
}

export interface Member {
  id: string;
  name: string;
  role: string;
  initials: string;
  avatarColor: string;
  status: "online" | "away" | "offline";
}

export interface Project {
  id: string;
  key: string; // e.g., "ORB", "DES", "MOB"
  name: string;
  description: string;
  color: string;
  icon: "layers" | "sparkles" | "smartphone";
  cycleName: string;
  cycleProgress: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  body: string;
  createdAt: string; // ISO string
}

export interface Issue {
  id: string; // internal uuid-like id
  identifier: string; // e.g., "ORB-101"
  projectId: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId: string | null;
  labels: LabelId[];
  subtasks: Subtask[];
  comments: Comment[];
  estimate: number; // story points (1, 2, 3, 5, 8)
  dueDate: string | null; // YYYY-MM-DD
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEvent {
  id: string;
  actorId: string;
  issueIdentifier?: string;
  issueTitle?: string;
  action:
    | "created"
    | "moved"
    | "updated"
    | "commented"
    | "completed"
    | "deleted"
    | "synced";
  detail: string;
  createdAt: string;
  source?: "local" | "remote";
}

export interface FilterState {
  search: string;
  priorities: IssuePriority[];
  labels: LabelId[];
  assigneeIds: string[];
  statuses: IssueStatus[];
}

export interface WorkspaceSnapshot {
  projects: Project[];
  members: Member[];
  issues: Issue[];
  activities: ActivityEvent[];
  nextIssueNumbers: Record<string, number>;
  updatedAt: string;
}
