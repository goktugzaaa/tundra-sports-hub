import { useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useMutation } from '../../../hooks/useMutation';
import { canAccess } from '../../../rbac';
import { taskRules, type Task } from '../../../domain';

/**
 * Task list hook. Exposes the scoped task list, a `toggle` action that
 * advances status through the domain cycle, and a `create` action.
 */
export function useTasks() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<Task[]>(() => service.tasks.getAll(), [user]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const mutation = useMutation();

  const canEdit = canAccess(user, 'task', 'update');

  async function toggle(task: Task) {
    if (!canEdit) return;
    setTogglingId(task.id);
    try {
      await service.tasks.update(task.id, {
        status: taskRules.toggleStatus(task.status),
      });
      state.reload();
    } finally {
      setTogglingId(null);
    }
  }

  async function create(data: Omit<Task, 'id'>): Promise<boolean> {
    const done = await mutation.run(() => service.tasks.create(data));
    if (done) state.reload();
    return done;
  }

  return {
    ...state,
    canEdit,
    canCreate: canAccess(user, 'task', 'create'),
    toggle,
    togglingId,
    create,
    saving: mutation.pending,
    saveError: mutation.error,
    clearSaveError: mutation.clearError,
  };
}
