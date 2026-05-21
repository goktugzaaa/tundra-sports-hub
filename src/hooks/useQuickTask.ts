import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useDataService } from '../services';
import { canAccess } from '../rbac';
import type { TaskPriority } from '../domain';

export interface QuickTaskDraft {
  title: string;
  athleteId?: string;
  priority?: TaskPriority;
  /** Days from today for the due date. Default 14. */
  dueInDays?: number;
}

/**
 * Cross-module quick task creation. Lets any list row spin off a
 * follow-up task (e.g. from a compliance item or an overdue payment)
 * without leaving the page. RBAC-gated by task-create capability.
 */
export function useQuickTask() {
  const service = useDataService();
  const { user } = useAuth();

  const canCreate = canAccess(user, 'task', 'create');
  const [createdKeys, setCreatedKeys] = useState<Set<string>>(new Set());
  const [busyKey, setBusyKey] = useState<string | null>(null);

  /** `key` ties the new task to its source row so the UI can confirm. */
  async function createTask(key: string, draft: QuickTaskDraft): Promise<boolean> {
    if (!canCreate || createdKeys.has(key)) return false;
    setBusyKey(key);
    try {
      const due = new Date();
      due.setDate(due.getDate() + (draft.dueInDays ?? 14));
      await service.tasks.create({
        title: draft.title,
        assignedTo: user.id,
        dueDate: due.toISOString().slice(0, 10),
        status: 'open',
        priority: draft.priority ?? 'medium',
        athleteId: draft.athleteId,
      });
      setCreatedKeys((s) => new Set(s).add(key));
      return true;
    } finally {
      setBusyKey(null);
    }
  }

  return { canCreate, createTask, createdKeys, busyKey };
}
