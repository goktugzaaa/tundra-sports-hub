import type { Task, TaskStatus, TaskPriority, TaskOwnerKind } from './types';

export function isOpenTask(status: TaskStatus): boolean {
  return status === 'open' || status === 'in_progress' || status === 'blocked';
}

export function isOverdueTask(task: Task, today: string): boolean {
  return isOpenTask(task.status) && task.dueDate < today;
}

/** Cycle the status when a user toggles a task. */
export function toggleStatus(status: TaskStatus): TaskStatus {
  const cycle: Record<TaskStatus, TaskStatus> = {
    open: 'in_progress',
    in_progress: 'done',
    done: 'open',
    blocked: 'open',
  };
  return cycle[status];
}

/** Sort weight for a priority — higher is more urgent. */
export function priorityRank(priority: TaskPriority): number {
  return { low: 0, medium: 1, high: 2 }[priority];
}

/** Classify what a task belongs to: an athlete, a recruiter, or the system. */
export function ownerKind(task: Task): TaskOwnerKind {
  if (task.athleteId) return 'athlete';
  if (task.assignedTo.startsWith('u-rec')) return 'recruiter';
  return 'system';
}
