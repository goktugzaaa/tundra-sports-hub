import type { ID, ISODate } from '../shared/types';

export type TaskStatus = 'open' | 'in_progress' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high';

/** What a task is attached to — drives RBAC scoping and grouping. */
export type TaskOwnerKind = 'athlete' | 'recruiter' | 'system';

export interface Task {
  id: ID;
  title: string;
  /** User the task is assigned to. */
  assignedTo: ID;
  dueDate: ISODate;
  status: TaskStatus;
  priority: TaskPriority;
  /** Optional athlete this task relates to — used for RBAC scoping. */
  athleteId?: ID;
}
