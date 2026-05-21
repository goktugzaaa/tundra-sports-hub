import type { Task } from './types';
import { isOverdueTask, isOpenTask, priorityRank } from './rules';

/**
 * Task domain service — workflow logic.
 * Pure: collections in, new entities / derived lists out.
 */

/** Produce a task reassigned to a different user. */
export function assignTask(task: Task, userId: string): Task {
  return { ...task, assignedTo: userId };
}

/** Tasks assigned to a given user. */
export function getTasksByUser(tasks: Task[], userId: string): Task[] {
  return tasks.filter((t) => t.assignedTo === userId);
}

/** Open tasks past their due date. */
export function getOverdueTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter((t) => isOverdueTask(t, today));
}

/** Count of tasks still open (open / in_progress / blocked). */
export function countOpen(tasks: Task[]): number {
  return tasks.filter((t) => isOpenTask(t.status)).length;
}

/** Tasks sorted by priority (high first) then due date (soonest first). */
export function sortByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const p = priorityRank(b.priority) - priorityRank(a.priority);
    return p !== 0 ? p : a.dueDate.localeCompare(b.dueDate);
  });
}
