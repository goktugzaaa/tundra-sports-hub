import { useAuth } from '../../../auth/AuthContext';
import { useDataService } from '../../../services';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useMutation } from '../../../hooks/useMutation';
import { canAccess } from '../../../rbac';
import type { Athlete } from '../../../domain';

/**
 * Athlete list hook. Module-layer: orchestrates the scoped service +
 * RBAC, exposes the list plus a `create` action. No component fetches.
 */
export function useAthletes() {
  const service = useDataService();
  const { user } = useAuth();

  const state = useAsyncData<Athlete[]>(() => service.athletes.getAll(), [user]);
  const mutation = useMutation();

  async function create(data: Omit<Athlete, 'id'>): Promise<boolean> {
    const done = await mutation.run(() => service.athletes.create(data));
    if (done) state.reload();
    return done;
  }

  return {
    ...state,
    canCreate: canAccess(user, 'athlete', 'create'),
    create,
    saving: mutation.pending,
    saveError: mutation.error,
    clearSaveError: mutation.clearError,
  };
}
